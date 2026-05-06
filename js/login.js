document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('submitBtn');
  const errEl = document.getElementById('loginError');
  const password = document.getElementById('password').value;

  btn.disabled = true;
  btn.textContent = 'Přihlašuji…';
  errEl.hidden = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const redirect = new URLSearchParams(window.location.search).get('from') || '/private/';
      window.location.href = redirect;
    } else if (res.status === 500) {
      errEl.textContent = 'Chyba serveru: HUB_PASSWORD není nastaveno v Cloudflare Pages secrets.';
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Přihlásit se';
    } else {
      errEl.textContent = 'Nesprávné heslo. Zkus to znovu.';
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Přihlásit se';
    }
  } catch {
    errEl.textContent = 'Chyba: /api/login neexistuje. Je projekt deploynutý na Cloudflare Pages?';
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Přihlásit se';
  }
});
