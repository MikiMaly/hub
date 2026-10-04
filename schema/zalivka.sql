-- Modul Zálivka — tabulky pro /private/zalivka.
--
-- Žijou v D1 databázi "gekos", protože hub má jediný D1 binding (env.DB) a ten
-- míří tam. Název databáze je historický; oddělit zálivku do vlastní by znamenalo
-- nový binding i v Pages dashboardu, což za to zatím nestojí.
--
-- Aplikace (idempotentní, dá se pustit opakovaně):
--   npx wrangler d1 execute gekos --remote --file=./schema/zalivka.sql
--
-- Pozn.: hub nemá vlastní migrations_dir — ten v wrangler.toml ukazuje do gekos
-- submodulu a patří gekonům. Proto je tohle schema aplikované ručně a psané tak,
-- aby opakované spuštění nic nerozbilo.

CREATE TABLE IF NOT EXISTS plants (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  species     TEXT    NOT NULL CHECK(species IN
                ('sukulent','kaktus','stredomorska','tropicka','orchidej','kapradina','bylinka')),
  pot_cm      INTEGER NOT NULL CHECK(pot_cm BETWEEN 6 AND 60),
  material    TEXT    NOT NULL CHECK(material IN ('terakota','plast','glazura')),
  light       TEXT    NOT NULL CHECK(light IN ('slunce','neprime','polostin','stin')),
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Jedna zálivka = jeden řádek. Oproti prototypu, který držel jen počítadlo —
-- díky tomu jde zpětně vidět, jestli se interval dodržuje, nebo jestli se
-- monstera zalévá po čtrnácti dnech místo deseti.
--
-- ml je doporučení platné v okamžik zálivky, ne naměřená hodnota. Ukládá se,
-- aby historie nelhala, když se později změní květináč nebo se přepíše model.
CREATE TABLE IF NOT EXISTS watering_events (
  id        INTEGER PRIMARY KEY,
  plant_id  INTEGER NOT NULL REFERENCES plants(id),
  ts        TEXT    NOT NULL,
  ml        INTEGER,
  note      TEXT
);

CREATE INDEX IF NOT EXISTS idx_watering_plant_ts ON watering_events(plant_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_watering_ts       ON watering_events(ts DESC);
