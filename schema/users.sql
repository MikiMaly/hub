-- Uživatelské účty — REFERENČNÍ podoba. Tabulky si zakládá functions/_users.js
-- (ensureSchema) při prvním requestu, ručně se nic spouštět nemusí.
--
-- Hesla: PBKDF2-SHA256, pass_iter iterací, pass_salt (base64, 16 B) → pass_hash (base64, 32 B).
-- session_version: součást podepsané session; zvýšením se účet odhlásí všude.

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY,
  username        TEXT    NOT NULL UNIQUE,          -- malými písmeny, [a-z0-9._-]{3,32}
  pass_hash       TEXT    NOT NULL,
  pass_salt       TEXT    NOT NULL,
  pass_iter       INTEGER NOT NULL,
  role            TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
  modules         TEXT    NOT NULL DEFAULT '["zalivka","spirala"]',  -- JSON pole; admin má vše
  session_version INTEGER NOT NULL DEFAULT 1,
  note            TEXT,                             -- "kdo jsi" z registrace
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at     TEXT,
  last_login_at   TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (          -- rate limit, pevné okno
  key          TEXT    PRIMARY KEY,                  -- login:user:<jméno> / login:ip:<ip> / register:ip:<ip>
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL                      -- unix sekundy
);

CREATE TABLE IF NOT EXISTS spiral_state (            -- Spirála: celý stav jako JSON na uživatele
  user_id    INTEGER PRIMARY KEY,
  data       TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

-- Zálivka: vlastník rostliny (doplňuje schema/zalivka.sql)
-- ALTER TABLE plants ADD COLUMN owner_id INTEGER;
-- CREATE INDEX IF NOT EXISTS idx_plants_owner ON plants(owner_id);
