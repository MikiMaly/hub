// Config — uprav dle potřeby
const PUBLIC_APPS = [
  {
    title: "Video Grabber",
    desc: "Stahuj videa z YouTube a dalších zdrojů přes jednoduché webové UI. Fronta, progress, paralelní stahování.",
    url: "https://github.com/MikiMaly/py_video_grabber/releases/latest",
    icon: "/assets/video-grabber.png",
    tag: "python / yt-dlp",
  },
];

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=');
    return k === name ? decodeURIComponent(v) : acc;
  }, null);
}

function makeCard(app) {
  const a = document.createElement('a');
  a.href = app.url;
  a.className = 'card card--link';
  if (app.external !== false) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  const iconHtml = (app.icon && app.icon.startsWith('/'))
    ? `<img src="${app.icon}" class="card-icon-img" alt="" />`
    : `<div class="card-icon">${app.icon || '🔗'}</div>`;
  a.innerHTML = `
    <div class="card-icon-wrap">${iconHtml}</div>
    <h3 class="card-title">${app.title}</h3>
    <p class="card-desc">${app.desc || ''}</p>
    <div class="card-footer">
      <span class="card-tag">${app.tag || ''}</span>
      <svg class="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </div>
  `;
  return a;
}

function renderPublicApps() {
  const grid = document.getElementById('publicGrid');
  if (!grid || PUBLIC_APPS.length === 0) return;
  grid.innerHTML = '';
  PUBLIC_APPS.forEach(app => grid.appendChild(makeCard(app)));
}

function checkAuth() {
  const isLoggedIn = getCookie('hub_ui') === '1'; // hub_auth je HttpOnly, JS čte hub_ui
  const adminLink = document.getElementById('adminLink');
  const privateContent = document.getElementById('privateContent');

  if (isLoggedIn) {
    if (adminLink) {
      adminLink.href = '/private/';
      adminLink.title = 'Privátní sekce';
    }
    if (privateContent) {
      privateContent.innerHTML = `
        <div style="padding: 16px 0;">
          <a href="/private/" class="btn btn--outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            Přejít do privátní sekce
          </a>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderPublicApps();
  checkAuth();
});
