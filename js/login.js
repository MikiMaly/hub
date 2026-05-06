let activeTab = 'password';

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabPassword').classList.toggle('active', tab === 'password');
  document.getElementById('tabCode').classList.toggle('active', tab === 'code');
  document.getElementById('fieldPassword').style.display = tab === 'password' ? '' : 'none';
  document.getElementById('fieldCode').style.display = tab === 'code' ? '' : 'none';
  document.getElementById('loginError').hidden = true;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('submitBtn');
  const errEl = document.getElementById('loginError');

  btn.disabled = true;
  btn.textContent = 'Přihlašuji…';
  errEl.hidden = true;

  const payload = activeTab === 'password'
    ? { password: document.getElementById('password').value }
    : { code: document.getElementById('code').value.trim().toUpperCase() };

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const redirect = new URLSearchParams(window.location.search).get('from') || '/private/';
      window.location.href = redirect;
    } else {
      const data = await res.json().catch(() => ({}));
      if (res.status === 500) {
        errEl.textContent = data.error || 'Chyba serveru.';
      } else {
        errEl.textContent = activeTab === 'password'
          ? 'Nesprávné heslo. Zkus to znovu.'
          : 'Neplatný kód pozvánky.';
      }
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Přihlásit se';
    }
  } catch {
    errEl.textContent = 'Chyba připojení.';
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Přihlásit se';
  }
});
