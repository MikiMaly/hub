/**
 * Gmail → mmaly.cz platby — Google Apps Script
 *
 * Jak nasadit:
 * 1. Jdi na script.google.com → Nový projekt
 * 2. Vlož tento kód
 * 3. Nastav konstanty WEBHOOK_URL a WEBHOOK_SECRET níže
 * 4. Spusť ručně jednou (checkPaymentEmails) → schval přístup ke Gmailu
 * 5. Přidej trigger: Triggers → + Add Trigger → checkPaymentEmails, Time-driven, Every hour
 */

const WEBHOOK_URL = 'https://mmaly.cz/api/payment-proposals';
const LABEL_NAME = 'payment-sent';

/**
 * Secret NIKDY nepiš do kódu — tenhle soubor je v gitu.
 * Ulož ho jednorázově: spusť funkci setSecret() s doplněnou hodnotou,
 * pak ji zase vymaž. Uloží se do Script Properties (mimo kód).
 */
function getSecret() {
  const s = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!s) throw new Error('WEBHOOK_SECRET není nastaven — spusť setSecret()');
  return s;
}

function setSecret() {
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_SECRET', 'SEM_VLOZ_SECRET');
  Logger.log('Secret uložen. Teď z tohoto řádku hodnotu smaž.');
}

// Odesílatelé — rozšiř podle potřeby
const SENDER_PATTERNS = [
  'apple.com',         // iCloud, App Store
  'google.com',        // Google Cloud, Workspace
  'spotify.com',       // Spotify
  'anthropic.com',     // Claude
  'csob.cz',           // ČSOB banka
  'generali.cz',       // Generali pojišťovna
  'vodafone.cz',       // Vodafone
  'pid.cz',            // Lítačka / PID
  'litacka.cz',
  'payzone.cz',        // parkovní automaty
  'zpspraha.cz'
];

// Email MUSÍ obsahovat alespoň jedno z těchto slov (kdekoliv), jinak se ignoruje
const PAYMENT_KEYWORDS = [
  'faktura', 'fakturu', 'faktury', 'invoice', 'receipt', 'účtenka', 'doklad',
  'platba', 'platbu', 'platby', 'payment', 'zaplacení', 'uhraďte', 'úhrada',
  'splatnost', 'předplatné', 'subscription', 'renewal', 'obnovení',
  'parkovné', 'parkování', 'jízdné', 'kupón', 'pojistné',
];

// Email se zahodí, pokud předmět obsahuje něco z tohoto (marketing, security)
const EXCLUDE_SUBJECT = [
  'security', 'zabezpečení', 'přihlášení', 'sign-in', 'sign in', 'login',
  'heslo', 'password', 'ověření', 'verify', 'newsletter', 'novinky',
  'sdílíte', 'úložiště', 'storage', 'je plné', 'sleva', 'akce', 'nabídka',
];

function checkPaymentEmails() {
  const label = getOrCreateLabel(LABEL_NAME);
  const secret = getSecret();

  // Odesílatel MUSÍ sedět AND zároveň MUSÍ padnout klíčové slovo o platbě
  const fromParts = SENDER_PATTERNS.map(s => `from:${s}`).join(' OR ');
  const kwParts = PAYMENT_KEYWORDS.map(k => `"${k}"`).join(' OR ');
  const excludeParts = EXCLUDE_SUBJECT.map(k => `-subject:"${k}"`).join(' ');
  const query = `(${fromParts}) (${kwParts}) ${excludeParts} -label:${LABEL_NAME} newer_than:7d`;

  Logger.log(`Query: ${query}`);
  const threads = GmailApp.search(query, 0, 20);
  Logger.log(`Nalezeno vláken: ${threads.length}`);

  for (const thread of threads) {
    const msg = thread.getMessages()[0];
    const emailFrom = msg.getFrom();
    const emailSubject = msg.getSubject();
    const emailBody = msg.getPlainBody();

    try {
      const response = UrlFetchApp.fetch(WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        headers: { 'Authorization': `Bearer ${secret}` },
        payload: JSON.stringify({ emailFrom, emailSubject, emailBody }),
      });

      const code = response.getResponseCode();
      if (code === 201 || code === 422) {
        // 201 = úspěch, 422 = AI nic nenašel v emailu → obojí označit jako zpracované
        thread.addLabel(label);
        Logger.log(`[${code}] ${emailSubject}`);
      } else {
        Logger.log(`[CHYBA ${code}] ${emailSubject}: ${response.getContentText()}`);
      }
    } catch (e) {
      Logger.log(`[VÝJIMKA] ${emailSubject}: ${e.message}`);
    }
  }
}

function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) ?? GmailApp.createLabel(name);
}

/**
 * TEST — vypíše, které emaily by filtr zachytil, ale NIC neodešle a nic neoznačí.
 * Spusť tuhle funkci při ladění filtru.
 */
function dryRun() {
  const fromParts = SENDER_PATTERNS.map(s => `from:${s}`).join(' OR ');
  const kwParts = PAYMENT_KEYWORDS.map(k => `"${k}"`).join(' OR ');
  const excludeParts = EXCLUDE_SUBJECT.map(k => `-subject:"${k}"`).join(' ');
  const query = `(${fromParts}) (${kwParts}) ${excludeParts} -label:${LABEL_NAME} newer_than:30d`;

  const threads = GmailApp.search(query, 0, 30);
  Logger.log(`Nalezeno ${threads.length} vláken (posledních 30 dní):\n`);
  for (const thread of threads) {
    const msg = thread.getMessages()[0];
    Logger.log(`  ${msg.getFrom()}\n    → ${msg.getSubject()}`);
  }
}

/**
 * TEST — ověří, že webhook přijímá secret (pošle úmyslně neúplná data).
 * Očekávaný výsledek: 400 = secret OK. 403 = secret špatně nebo chybí redeploy.
 */
function testAuth() {
  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { 'Authorization': `Bearer ${getSecret()}` },
    payload: JSON.stringify({}),
  });
  const code = response.getResponseCode();
  Logger.log(`HTTP ${code}: ${response.getContentText()}`);
  Logger.log(code === 400 ? '✅ Secret sedí.' : code === 403 ? '❌ Secret nesedí nebo chybí redeploy v Cloudflare.' : '⚠️ Neočekávaný stav.');
}
