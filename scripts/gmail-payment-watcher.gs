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
const WEBHOOK_SECRET = 'DOPLNIT_PAYMENTS_WEBHOOK_SECRET';
const LABEL_NAME = 'payment-sent';

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
];

// Klíčová slova v předmětu pro parking (odesílatel bývá různý)
const SUBJECT_KEYWORDS = ['parkov', 'parking', 'faktura', 'invoice', 'platba', 'payment'];

function checkPaymentEmails() {
  const label = getOrCreateLabel(LABEL_NAME);

  // Sestavení Gmail search query
  const fromParts = SENDER_PATTERNS.map(s => `from:${s}`).join(' OR ');
  const subjParts = SUBJECT_KEYWORDS.map(k => `subject:${k}`).join(' OR ');
  const query = `(${fromParts} OR (${subjParts})) -label:${LABEL_NAME} newer_than:7d`;

  const threads = GmailApp.search(query, 0, 20);

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
        headers: { 'Authorization': `Bearer ${WEBHOOK_SECRET}` },
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
