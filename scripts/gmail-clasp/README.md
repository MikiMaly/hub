# Gmail platby → mmaly.cz (clasp projekt)

Tenhle adresář je propojený s Apspt Script projektem přes
[clasp](https://github.com/google/clasp). Kód se nasazuje příkazem `clasp push`
místo ručního kopírování do editoru.

## Jednorázové nastavení

1. **Zapni Apps Script API** — [script.google.com/home/usersettings](https://script.google.com/home/usersettings) → přepínač zapnout
2. **Přihlas se:**
   ```bash
   clasp login
   ```
3. **Zjisti Script ID** — v Apps Script projektu: ⚙ Nastavení projektu → „ID skriptu"
4. **Propoj adresář** — vytvoř `.clasp.json` (viz níže) se Script ID

`.clasp.json` (necommituje se, je v .gitignore):
```json
{
  "scriptId": "SEM_SCRIPT_ID",
  "rootDir": "."
}
```

## Nasazení změn

Z tohoto adresáře:
```bash
clasp push
```

Poprvé použij `clasp push -f` — přepíše obsah projektu verzí z repa.
Triggery ani Script Properties (secret) se tím nemažou, ty žijí v projektu.

## Soubory

- `Code.gs` — vlastní logika (filtr, klasifikace, webhook)
- `appsscript.json` — manifest projektu
