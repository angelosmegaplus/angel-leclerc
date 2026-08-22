const { importBrowserData } = require('./import-data');

const HOME = 'https://www.google.com/';
const SEARCH = 'https://www.google.com/search?q=';
const TRACKERS = [
  'doubleclick.net','googlesyndication.com','google-analytics.com','googletagmanager.com',
  'facebook.net','connect.facebook.net','scorecardresearch.com','hotjar.com','segment.io',
  'mixpanel.com','adnxs.com','criteo.com','taboola.com','outbrain.com'
];

const state = {
  tabs: [],
  activeId: null,
  bookmarks: readJSON('flamingbox.bookmarks', []),
  history: readJSON('flamingbox.history', []),
  settings: readJSON('flamingbox.settings', { home: HOME, blockTrackers: true })
};

const $ = (id) => document.getElementById(id);
const tabsEl = $('tabs');
const viewport = $('viewport');
const address = $('address');
const panel = $('panel');

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function uid() { return `t${Date.now()}${Math.random().toString(16).slice(2)}`; }
function active() { return state.tabs.find(t => t.id === state.activeId); }
function escapeHTML(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function isURLLike(v) { return /^(https?:\/\/|file:\/\/|localhost(?::\d+)?(?:\/|$)|(?:[\w-]+\.)+[a-z]{2,}(?:\/|$))/i.test(v); }
function normalizeInput(raw) {
  const v = raw.trim();
  if (!v) return state.settings.home || HOME;
  if (isURLLike(v)) return /^[a-z]+:\/\//i.test(v) ? v : `https://${v}`;
  return `${SEARCH}${encodeURIComponent(v)}`;
}

function createTab(url = state.settings.home || HOME, opts = {}) {
  const id = uid();
  const tab = { id, title: opts.private ? 'Privé' : 'Nouvel onglet', url, private: !!opts.private };
  const webview = document.createElement('webview');
  webview.className = 'webview';
  webview.setAttribute('allowpopups', 'true');
  webview.setAttribute('partition', opts.private ? `temporary:${id}` : 'persist:flamingbox');
  webview.src = url;
  tab.webview = webview;
  viewport.appendChild(webview);
  state.tabs.push(tab);
  wireWebview(tab);
  activateTab(id);
  renderTabs();
  return tab;
}

function wireWebview(tab) {
  const w = tab.webview;
  const sync = () => {
    try { tab.url = w.getURL() || tab.url; } catch {}
    try { tab.title = w.getTitle() || tab.url || 'FlamingBox'; } catch {}
    if (state.activeId === tab.id) {
      address.value = tab.url || '';
      updateSecurity(tab.url || '');
      updateBookmarkButton();
    }
    renderTabs();
  };

  w.addEventListener('loadstart', sync);
  w.addEventListener('loadstop', () => { sync(); recordHistory(tab); });
  w.addEventListener('loadcommit', sync);
  w.addEventListener('page-title-updated', sync);
  w.addEventListener('newwindow', (e) => {
    e.preventDefault?.();
    if (e.targetUrl) createTab(e.targetUrl, { private: tab.private });
  });
  w.addEventListener('permissionrequest', (e) => {
    const allowed = ['media','geolocation','notifications'].includes(e.permission);
    allowed ? e.request.allow() : e.request.deny();
  });

  try {
    if (state.settings.blockTrackers && w.request?.onBeforeRequest) {
      w.request.onBeforeRequest.addListener(
        d => {
          try {
            const h = new URL(d.url).hostname.toLowerCase();
            if (TRACKERS.some(t => h === t || h.endsWith('.' + t))) return { cancel: true };
          } catch {}
          return {};
        },
        { urls: ['<all_urls>'] },
        ['blocking']
      );
    }
  } catch (err) { console.warn('Tracker blocker unavailable', err); }
}

function activateTab(id) {
  state.activeId = id;
  for (const t of state.tabs) t.webview.classList.toggle('active', t.id === id);
  const t = active();
  address.value = t?.url || '';
  updateSecurity(t?.url || '');
  updateBookmarkButton();
  renderTabs();
}

function closeTab(id) {
  const idx = state.tabs.findIndex(t => t.id === id);
  if (idx < 0) return;
  const [tab] = state.tabs.splice(idx, 1);
  tab.webview.remove();
  if (!state.tabs.length) return createTab();
  if (state.activeId === id) activateTab(state.tabs[Math.max(0, idx - 1)]?.id || state.tabs[0].id);
  renderTabs();
}

function renderTabs() {
  tabsEl.innerHTML = '';
  for (const t of state.tabs) {
    const btn = document.createElement('button');
    btn.className = `tab ${t.id === state.activeId ? 'active' : ''}`;
    btn.title = t.title || t.url;
    btn.innerHTML = `<span>${t.private ? '◉' : '●'}</span><span class="tab-title">${escapeHTML(t.title || 'Nouvel onglet')}</span><span class="tab-close">×</span>`;
    btn.addEventListener('click', e => {
      if (e.target.classList.contains('tab-close')) closeTab(t.id); else activateTab(t.id);
    });
    tabsEl.appendChild(btn);
  }
}

function recordHistory(tab) {
  if (tab.private || !/^https?:\/\//i.test(tab.url || '')) return;
  const entry = { url: tab.url, title: tab.title || tab.url, visitedAt: new Date().toISOString() };
  state.history = [entry, ...state.history.filter(h => h.url !== entry.url)].slice(0, 2000);
  writeJSON('flamingbox.history', state.history);
  renderLibrary();
}

function toggleBookmark() {
  const t = active();
  if (!t?.url) return;
  const i = state.bookmarks.findIndex(b => b.url === t.url);
  if (i >= 0) state.bookmarks.splice(i, 1);
  else state.bookmarks.unshift({ url: t.url, title: t.title || t.url, addedAt: new Date().toISOString(), source: 'FlamingBox' });
  writeJSON('flamingbox.bookmarks', state.bookmarks);
  updateBookmarkButton();
  renderLibrary();
}
function updateBookmarkButton() {
  const t = active();
  $('bookmark').textContent = t && state.bookmarks.some(b => b.url === t.url) ? '★' : '☆';
}
function updateSecurity(url) {
  const s = $('security');
  if (/^https:\/\//i.test(url)) { s.textContent='●'; s.title='Connexion HTTPS'; s.style.color='#58d68d'; }
  else { s.textContent='●'; s.title='Connexion non chiffrée ou page locale'; s.style.color='#f4b942'; }
}

function renderLibrary() {
  const fill = (id, items) => {
    const root = $(id); root.innerHTML='';
    if (!items.length) { root.innerHTML='<div class="empty">Aucun élément</div>'; return; }
    for (const x of items.slice(0, 100)) {
      const b = document.createElement('button');
      b.className='list-item';
      b.innerHTML=`<span class="item-title">${escapeHTML(x.title || x.url)}</span><span class="item-url">${escapeHTML(x.url)}</span>`;
      b.addEventListener('click', () => { createTab(x.url); panel.classList.add('hidden'); });
      root.appendChild(b);
    }
  };
  fill('bookmarksList', state.bookmarks);
  fill('historyList', state.history);
}

async function doImport() {
  const status = $('importStatus');
  status.textContent='Analyse des profils Firefox, Chrome, Chromium et Edge…';
  try {
    const result = await importBrowserData();
    const seen = new Set(state.bookmarks.map(x => x.url));
    let added=0;
    for (const b of result.bookmarks || []) {
      if (b.url && !seen.has(b.url)) { state.bookmarks.push(b); seen.add(b.url); added++; }
    }
    writeJSON('flamingbox.bookmarks', state.bookmarks);
    status.textContent = `${added} favoris ajoutés. Sources : ${(result.sources || []).join(', ') || 'aucune détectée'}.${result.warnings?.length ? ' ' + result.warnings.join(' | ') : ''}`;
    renderLibrary();
  } catch (err) { status.textContent=`Import impossible : ${err.message}`; }
}

$('addressForm').addEventListener('submit', e => { e.preventDefault(); const t=active(); if (t) t.webview.src=normalizeInput(address.value); });
$('newTab').addEventListener('click', () => createTab());
$('back').addEventListener('click', () => { const w=active()?.webview; try { if (w?.canGoBack()) w.back(); } catch {} });
$('forward').addEventListener('click', () => { const w=active()?.webview; try { if (w?.canGoForward()) w.forward(); } catch {} });
$('reload').addEventListener('click', () => { try { active()?.webview.reload(); } catch {} });
$('home').addEventListener('click', () => { const t=active(); if (t) t.webview.src=state.settings.home || HOME; });
$('bookmark').addEventListener('click', toggleBookmark);
$('library').addEventListener('click', () => { renderLibrary(); panel.classList.toggle('hidden'); });
$('closePanel').addEventListener('click', () => panel.classList.add('hidden'));
$('importData').addEventListener('click', doImport);

window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase()==='l') { e.preventDefault(); address.focus(); address.select(); }
  if (e.ctrlKey && e.key.toLowerCase()==='t') { e.preventDefault(); createTab(); }
  if (e.ctrlKey && e.key.toLowerCase()==='w') { e.preventDefault(); closeTab(state.activeId); }
  if (e.ctrlKey && e.key.toLowerCase()==='d') { e.preventDefault(); toggleBookmark(); }
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='n') { e.preventDefault(); createTab(state.settings.home || HOME, { private:true }); }
  if (e.altKey && e.key==='ArrowLeft') { e.preventDefault(); $('back').click(); }
  if (e.altKey && e.key==='ArrowRight') { e.preventDefault(); $('forward').click(); }
});

renderLibrary();
createTab();
