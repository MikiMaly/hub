/**
 * Podepsané session cookies — HMAC-SHA256, podpisový klíč je HUB_PASSWORD.
 *
 * Cookie `hub_session` = base64url(payload) + "." + base64url(hmac)
 * Payload: { role: 'admin' | 'user', exp: unix sekundy }
 *
 * Pozn.: změna HUB_PASSWORD zneplatní všechny existující sessions.
 */

export const SESSION_COOKIE = 'hub_session';

const enc = new TextEncoder();

function b64url(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function hmacKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, [usage],
  );
}

export async function signSession(role, secret, maxAgeSeconds) {
  const payload = enc.encode(JSON.stringify({
    role,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }));
  const key = await hmacKey(secret, 'sign');
  const sig = await crypto.subtle.sign('HMAC', key, payload);
  return `${b64url(payload)}.${b64url(sig)}`;
}

/** Ověří hodnotu cookie; vrátí { role } nebo null. */
export async function verifySession(value, secret) {
  if (!value || !secret) return null;
  const [payloadB64, sigB64] = value.split('.');
  if (!payloadB64 || !sigB64) return null;

  let payloadBytes, sigBytes;
  try {
    payloadBytes = b64urlDecode(payloadB64);
    sigBytes = b64urlDecode(sigB64);
  } catch {
    return null;
  }

  const key = await hmacKey(secret, 'verify');
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes);
  if (!valid) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.role !== 'admin' && payload.role !== 'user') return null;

  return { role: payload.role };
}

/** Přečte a ověří session z requestu; vrátí { role } nebo null. */
export async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      return verifySession(rest.join('='), env.HUB_PASSWORD);
    }
  }
  return null;
}
