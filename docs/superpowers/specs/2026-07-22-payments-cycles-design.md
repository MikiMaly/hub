# Platby: cykly předplatného, obvyklé částky a hlídání úhrad

Datum: 2026-07-22
Stav: návrh schválen, čeká na implementační plán

## Problém

Dnešní tracker ukládá plochý seznam plateb. Každý příchozí mail vytvoří nový
samostatný záznam, takže po třech měsících existují tři různá „Spotify" místo
jednoho předplatného se třemi strženými platbami. Bez vazby mezi platbami nejde
spočítat obvyklou částku ani ověřit, že platba proběhla.

Zároveň systém nerozlišuje mezi výzvou k zaplacení a potvrzením o zaplacení,
přestože to jsou opačné události.

## Cíle

1. Hlídat změny cen — upozornit, když částka vybočí od obvyklé
2. Předvídat platby dopředu — z periody vědět, co a kdy přijde
3. Přehled útraty za služby — historie u každého předplatného
4. Odhalit zapomenutá předplatná — termín prošel a nepřišlo nic

## Princip

Uživatel zadává **očekávání**, systém ho ověřuje proti mailům. Ne naopak.
Maily nezakládají platby — buď potvrzují, že očekávaná platba proběhla, nebo
vyzývají k úhradě.

Režim platby (automatické stržení vs. ruční úhrada) se **nenastavuje**, ale
pozoruje. Systém ví, že platba měla proběhnout, a podle druhu mailu pozná,
jestli proběhla.

## Datový model

KV `PAYMENTS`, dva klíče.

### `payments:subscriptions`

```js
{
  id: string,              // crypto.randomUUID()
  name: string,            // "Spotify Premium"
  expectedAmount: number,  // 199 — očekávaná částka v CZK
  cycleMonths: number,     // 1 | 3 | 12 — perioda v celých měsících
  nextDueDate: string,     // "2026-08-15" — kdy se čeká další platba
  amountVaries: boolean,   // true = nehlídat odchylku (Twisto, Vodafone)
  matchHints: string[],    // ["spotify.com"] — pro párování mailů
  accountNumber?: string,
  varSymbol?: string,
  note?: string,
  archived?: boolean,      // zrušené předplatné, drží se kvůli historii
}
```

`cycleMonths` v celých měsících stačí — pokrývá měsíční, čtvrtletní i roční
platby. Týdenní ani nepravidelné periody se nevyskytují.

### `payments:charges`

```js
{
  id: string,
  subscriptionId: string,
  amount: number,          // skutečně zaplacená částka
  date: string,            // "2026-07-15" — kdy zaplaceno
  source: 'mail' | 'ručně',
  emailSubject?: string,
}
```

Historie roste ~15 záznamů měsíčně, tedy nižší stovky ročně. Jeden KV klíč to
unese bez stránkování.

### Migrace stávajících dat

V `payments:list` jsou dnes záznamy `{id, name, amount, dueDate, recurringMonths,
status}`. Jednorázový skript je převede na předplatná:
`amount → expectedAmount`, `dueDate → nextDueDate`, `recurringMonths → cycleMonths`.
Záznamy se `status: 'pending'` se zahodí — jsou to neschválené návrhy z testů.
Původní klíč `payments:list` se ponechá nedotčený jako záloha.

### Jednorázové platby

`cycleMonths: 0` znamená platbu bez opakování. Po zaplacení se `nextDueDate`
neposouvá — předplatné se označí `archived: true` a zmizí ze seznamu aktivních.
V historii zůstane dohledatelné.

## Klasifikace mailů

AI dostane k dosavadní extrakci ještě jeden úkol — určit druh mailu:

| `kind` | Význam | Příklad |
|---|---|---|
| `paid` | Platba proběhla | „Potvrzení objednávky", účtenka, „platba přijata" |
| `due` | Výzva k úhradě | faktura, „blíží se splatnost", „platba se nezdařila" |
| `none` | Není o platbě | marketing, upozornění na zabezpečení |

Rozdíl je zásadní: `paid` odškrtne platbu jako vyřízenou, `due` ji naopak
postaví do fronty k zaplacení.

## Párování mailu s předplatným

1. Doména odesílatele proti `matchHints` — nejspolehlivější signál
2. Při neshodě porovnání názvu (case-insensitive, bez diakritiky)
3. Když nesedí nic, nabídne se jako **nové předplatné** k založení; při
   schválení se doména odesílatele uloží do `matchHints`

Párování se uživateli vždy zobrazí ke schválení, nikdy neproběhne potichu.
To bylo výslovné rozhodnutí — kontrola je přednější než úspora kliků.

## Odvozené stavy

Stav se nikdy neukládá, počítá se při každém načtení z `nextDueDate`, historie
a nevyřízených mailů.

| Stav | Podmínka | Zobrazení |
|---|---|---|
| Blíží se | `nextDueDate` do 7 dní, žádný mail | Za 5 dní: Lítačka, čekáš 1 250 Kč |
| K zaplacení | dorazil mail `kind: due` | K zaplacení: Twisto 2 140 Kč |
| Zaplaceno | charge s datem v aktuálním období | Zaplaceno 15. 7.: Spotify 199 Kč |
| Nepotvrzeno | `nextDueDate` prošlo, nic nepřišlo | Mělo se strhnout před 3 dny |
| Odchylka | \|amount − obvyklá\| / obvyklá > 20 % | Vodafone 890 Kč, obvykle 650 Kč |

**Aktuální období** je interval `<nextDueDate − cycleMonths, nextDueDate)`.
Charge s datem uvnitř tohoto intervalu znamená, že platba za toto období už
proběhla. Díky tomu se předplatné neoznačí jako nezaplacené jen proto, že se
platba strhla o pár dní dřív, než systém čekal.

**Obvyklá částka** = medián posledních šesti plateb, ne průměr. Medián se
nenechá rozhodit jedním vyskočením, takže po jednorázově vysoké faktuře
nezmizí upozornění na trvalé zdražení.

Odchylka se nehlídá u předplatných s `amountVaries: true`. U Twista nebo
Vodafonu částka kolísá z principu a hlídání by pípalo pořád.

## Uživatelské rozhraní

Stránka `/private/payments` se přestrukturuje na seznam předplatných, kde
každý řádek nese svůj odvozený stav a je rozklikávací do historie plateb.

Nad seznamem zůstane fronta nespárovaných a čekajících mailů se stejnými
tlačítky jako dnes.

Po rozkliknutí předplatného se zobrazí seznam stržených plateb — datum,
částka, zdroj — a souhrn: obvyklá částka, kolik to stojí ročně, kdy se
naposledy měnila cena.

U každého předplatného ve stavu **K zaplacení** nebo **Nepotvrzeno** je
tlačítko „Zaplaceno". Klik založí charge se `source: 'ručně'` a posune
`nextDueDate` o `cycleMonths` dopředu.

Přijetí mailu `kind: paid` udělá totéž se `source: 'mail'`.

## API

| Endpoint | Změna |
|---|---|
| `GET /api/subscriptions` | nový — seznam s odvozenými stavy a obvyklou částkou |
| `POST/PUT/DELETE /api/subscriptions` | nový — CRUD, admin only |
| `POST /api/charges` | nový — zápis úhrady, posune `nextDueDate` |
| `GET /api/charges?subscriptionId=` | nový — historie pro rozkliknutí |
| `POST /api/payment-proposals` | rozšíření o `kind` a párování |

Autorizace se nemění: session `role: 'admin'` pro UI, `PAYMENTS_WEBHOOK_SECRET`
pro webhook.

## Twisto

Doména `twisto.cz` se přidá do `SENDER_PATTERNS` v Gmail skriptu. Předplatné
se založí ručně s `amountVaries: true`, protože měsíční vyúčtování má pokaždé
jinou částku.

## Mimo rozsah

- Zpětné skenování Gmailu kvůli historii — očekávání zadává uživatel
- Automatické schvalování bez potvrzení
- Jiné periody než celé měsíce
- Sledování, které předplatné se nepoužívá (jen platí)

## Testování

Čistě funkční logiku lze testovat bez Cloudflare:

- `normalizeAmount` / `normalizeDate` — už pokryto
- výpočet `nextDueDate` při posunu o periodu, včetně přelomu roku a konce měsíce
  (31. 1. + 1 měsíc)
- medián a detekce odchylky, včetně málo dat (0–2 platby → nehlídat)
- odvození stavu z kombinace data, historie a čekajících mailů
- párování mailu proti `matchHints`

Klasifikace mailů AI se ověří přes `testSend()` proti skutečné poště, protože
jde o kvalitu modelu, ne o logiku.
