/**
 * Uživatelské účty: schema v D1, hesla, moduly, rate limit a session cookies.
 *
 * Hesla: PBKDF2-SHA256, 100 000 iterací (strop Cloudflare Workers), 16 B
 * náhodná sůl na uživatele, 32 B výstup. V DB je jen hash, sůl a počet
 * iterací — díky uloženému počtu jde později iterace zvýšit bez resetu hesel.
 *
 * Schema si funkce zakládají samy (ensureSchema), aby nasazení nevyžadovalo
 * ruční `wrangler d1 execute`. Všechny kroky jsou idempotentní.
 * Referenční podoba: schema/users.sql.
 */
import { getSession, signSession, SESSION_COOKIE } from './_auth.js';

// Moduly, které jde uživateli povolit. Admin má vždy všechny.
export const MODULES = ['zalivka', 'spirala', 'geckos', 'polymarket'];
export const DEFAULT_MODULES = ['zalivka', 'spirala'];

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const PBKDF2_ITER = 100_000;
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;
export const PASSWORD_MIN = 10;
const PASSWORD_MAX = 256; // PBKDF2 nad megabajtovým "heslem" by byl levný DoS

const enc = new TextEncoder();

export function json(data, status = 200, headers) {
  const h = new Headers(headers);
  h.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers: h });
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

let schemaReady = null;

export function ensureSchema(env) {
  if (!env.DB) return Promise.reject(new Error('D1 not bound'));
  if (!schemaReady) {
    schemaReady = migrate(env.DB).catch((e) => {
      schemaReady = null; // příští request to zkusí znovu
      throw e;
    });
  }
  return schemaReady;
}

async function migrate(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY,
      username        TEXT    NOT NULL UNIQUE,
      pass_hash       TEXT    NOT NULL,
      pass_salt       TEXT    NOT NULL,
      pass_iter       INTEGER NOT NULL,
      role            TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
      modules         TEXT    NOT NULL DEFAULT '["zalivka","spirala"]',
      session_version INTEGER NOT NULL DEFAULT 1,
      note            TEXT,
      created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      approved_at     TEXT,
      last_login_at   TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
      key          TEXT    PRIMARY KEY,
      count        INTEGER NOT NULL,
      window_start INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS spiral_state (
      user_id    INTEGER PRIMARY KEY,
      data       TEXT    NOT NULL,
      updated_at TEXT    NOT NULL
    )`),
    // Zálivka: tabulky už v produkci jsou (schema/zalivka.sql); tady jen pro
    // čerstvou databázi, ať aplikace nespadne.
    db.prepare(`CREATE TABLE IF NOT EXISTS plants (
      id          INTEGER PRIMARY KEY,
      name        TEXT    NOT NULL,
      species     TEXT    NOT NULL,
      pot_cm      INTEGER NOT NULL,
      material    TEXT    NOT NULL,
      light       TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      owner_id    INTEGER
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS watering_events (
      id        INTEGER PRIMARY KEY,
      plant_id  INTEGER NOT NULL REFERENCES plants(id),
      ts        TEXT    NOT NULL,
      ml        INTEGER,
      note      TEXT
    )`),
  ]);

  const { results } = await db.prepare(`PRAGMA table_info(plants)`).all();
  if (!results.some((c) => c.name === 'owner_id')) {
    try {
      await db.prepare(`ALTER TABLE plants ADD COLUMN owner_id INTEGER`).run();
    } catch (e) {
      // Souběžný request z jiného isolate už sloupec přidal.
      if (!String(e?.message ?? e).includes('duplicate column')) throw e;
    }
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_plants_owner ON plants(owner_id)`).run();
}

// ---------------------------------------------------------------------------
// Hesla
// ---------------------------------------------------------------------------

function b64(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin);
}

function unb64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITER);
  return { pass_hash: b64(hash), pass_salt: b64(salt), pass_iter: PBKDF2_ITER };
}

export async function verifyPassword(password, user) {
  const hash = await pbkdf2(password, unb64(user.pass_salt), user.pass_iter);
  return timingSafeEqual(hash, unb64(user.pass_hash));
}

// Když uživatel neexistuje, spočítám hash stejně — jinak by rychlá odpověď
// prozradila, která jména v DB jsou.
const DUMMY = { pass_salt: 'AAAAAAAAAAAAAAAAAAAAAA==', pass_hash: b64(new Uint8Array(32)), pass_iter: PBKDF2_ITER };
export async function burnPasswordCheck(password) {
  await verifyPassword(password, DUMMY);
}

/** Porovnání dvou řetězců v konstantním čase (HUB_PASSWORD při bootstrapu). */
export async function secretEquals(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b))),
  ]);
  return timingSafeEqual(new Uint8Array(ha), new Uint8Array(hb));
}

export function normalizeUsername(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

/** Vrátí kód chyby, nebo null když je jméno v pořádku. */
export function usernameError(username) {
  if (!USERNAME_RE.test(username)) return 'invalid_username';
  return null;
}

export function passwordError(password, username) {
  if (typeof password !== 'string') return 'invalid_password';
  if (password.length < PASSWORD_MIN) return 'password_too_short';
  if (password.length > PASSWORD_MAX) return 'password_too_long';
  if (username && password.toLowerCase().includes(username)) return 'password_contains_username';
  return null;
}

/** Náhodné dočasné heslo pro reset adminem (bez zaměnitelných znaků). */
export function randomPassword(length = 16) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

// ---------------------------------------------------------------------------
// Uživatelé a moduly
// ---------------------------------------------------------------------------

export function modulesOf(user) {
  if (user.role === 'admin') return [...MODULES];
  let list = [];
  try {
    list = JSON.parse(user.modules);
  } catch {
    list = [];
  }
  return Array.isArray(list) ? list.filter((m) => MODULES.includes(m)) : [];
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    modules: modulesOf(user),
    note: user.note ?? null,
    created_at: user.created_at,
    approved_at: user.approved_at ?? null,
    last_login_at: user.last_login_at ?? null,
  };
}

/**
 * Přihlášený uživatel z requestu, ověřený proti D1: podpis cookie, účet
 * existuje, je aktivní a session_version sedí. Jinak null.
 */
export async function getUser(request, env) {
  const session = await getSession(request, env);
  if (!session) return null;
  await ensureSchema(env);
  const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(session.uid).first();
  if (!user || user.status !== 'active' || user.session_version !== session.sv) return null;
  return { id: user.id, username: user.username, role: user.role, modules: modulesOf(user) };
}

export async function sessionCookies(user, env) {
  const token = await signSession(
    { uid: user.id, role: user.role, sv: user.session_version },
    env.HUB_PASSWORD,
    SESSION_MAX_AGE,
  );
  const max = SESSION_MAX_AGE;
  const cookies = [
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${max}; HttpOnly; Secure; SameSite=Lax`,
    // Jen UX nápověda pro klienta (co zobrazit); skutečnou kontrolu dělá server.
    `hub_ui=1; Path=/; Max-Age=${max}; Secure; SameSite=Lax`,
    user.role === 'admin'
      ? `hub_admin_ui=1; Path=/; Max-Age=${max}; Secure; SameSite=Lax`
      : `hub_admin_ui=; Path=/; Max-Age=0; Secure; SameSite=Lax`,
  ];
  return cookies;
}

// ---------------------------------------------------------------------------
// Rate limit (pevné okno v D1)
// ---------------------------------------------------------------------------

/** Započte pokus; vrátí true, když je klíč ještě pod limitem. */
export async function hit(env, key, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `INSERT INTO login_attempts (key, count, window_start) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count        = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END
     RETURNING count`
  )
    .bind(key, now, now - windowSec, now - windowSec)
    .first();
  return (row?.count ?? 1) <= max;
}

export async function clearHits(env, key) {
  await env.DB.prepare(`DELETE FROM login_attempts WHERE key = ?`).bind(key).run();
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}
