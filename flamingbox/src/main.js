const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { importBrowserData } = require('./import-data');

let mainWindow;
let dataCache = null;

const privacyStats = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  blockedTrackers: 0,
  httpsUpgrades: 0,
  popupsBlocked: 0,
  guardianAlerts: 0,
  downloadsObserved: 0,
  riskyDownloadsBlocked: 0,
  permissionPrompts: 0
};

const TRACKER_HOSTS = [
  'doubleclick.net', 'googlesyndication.com', 'google-analytics.com', 'googletagmanager.com',
  'connect.facebook.net', 'facebook.net', 'scorecardresearch.com', 'hotjar.com', 'segment.io',
  'mixpanel.com', 'adnxs.com', 'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com',
  'branch.io', 'app-measurement.com', 'adjust.com', 'adsrvr.org', 'quantserve.com',
  'zedo.com', 'mathtag.com', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
  'demdex.net', 'casalemedia.com', 'bluekai.com', 'chartbeat.com', 'newrelic.com'
];

const PAYMENT_HOST_HINTS = [
  'paypal.com', 'stripe.com', 'stripe.network', 'adyen.com', 'checkout.com', 'klarna.com',
  'amazonpay.com', 'pay.google.com', 'payments.google.com', 'paylib.fr', 'lyra.com',
  'monext.fr', 'worldline.com', 'sips-services.com', '3dsecure', 'secure-payment', 'payment'
];

const DANGEROUS_DOWNLOAD_EXTENSIONS = new Set([
  '.exe', '.msi', '.msp', '.bat', '.cmd', '.com', '.scr', '.ps1', '.vbs', '.vbe', '.js', '.jse', '.jar'
]);

function hostname(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
}

function isPaymentURL(url) {
  const host = hostname(url);
  const lower = String(url || '').toLowerCase();
  return PAYMENT_HOST_HINTS.some((hint) => host === hint || host.endsWith('.' + hint) || lower.includes(hint));
}

function isTracker(url) {
  const host = hostname(url);
  return TRACKER_HOSTS.some((t) => host === t || host.endsWith('.' + t));
}

function isLocalHost(url) {
  const host = hostname(url);
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
}

function dataFile() {
  // Keep the historic filename so upgrades preserve existing bookmarks/history.
  return path.join(app.getPath('userData'), 'angel-os', 'flamingbox-data.json');
}

function defaultData() {
  return {
    bookmarks: [],
    history: [],
    settings: {
      home: 'file://flamme-search',
      search: 'https://www.qwant.com/?l=fr&r=FR&t=all&q=%s',
      telemetry: false,
      blockTrackers: true,
      blockPopups: true,
      httpsFirst: true,
      angelOSKernel: true,
      guardian: true
    }
  };
}

function loadDataFromDisk() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8');
    const parsed = JSON.parse(raw);
    const merged = { ...defaultData(), ...parsed, settings: { ...defaultData().settings, ...(parsed.settings || {}) } };
    // Migrate old Google defaults without touching explicit user choices unrelated to those defaults.
    if (/google\.com/i.test(String(merged.settings.home || ''))) merged.settings.home = defaultData().settings.home;
    if (/google\.com\/search/i.test(String(merged.settings.search || ''))) merged.settings.search = defaultData().settings.search;
    return merged;
  } catch {
    return defaultData();
  }
}

function readData() {
  if (!dataCache) dataCache = loadDataFromDisk();
  return dataCache;
}

function writeData(data) {
  dataCache = data;
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function sendGuardianAlert(payload) {
  privacyStats.guardianAlerts += 1;
  mainWindow?.webContents.send('guardian:alert', payload);
}

async function askOneTimePermission(permission, origin, details) {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  privacyStats.permissionPrompts += 1;
  const host = hostname(origin) || origin;
  const detail = permission === 'media' && details?.mediaTypes?.length
    ? `Accès demandé : ${details.mediaTypes.join(', ')}.`
    : `Permission demandée : ${permission}.`;
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Autoriser cette fois', 'Bloquer'],
    defaultId: 1,
    cancelId: 1,
    title: 'Flamme — Permission temporaire',
    message: `${host} demande une autorisation`,
    detail: `${detail}\nCette autorisation n'est pas enregistrée comme permission permanente par Flamme.`
  });
  return result.response === 0;
}

function setupSessionProtection(ses) {
  if (ses.__flammeHardened) return;
  ses.__flammeHardened = true;

  const requestTimes = [];
  let lastGuardianAlert = 0;

  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const origin = details?.requestingUrl || webContents.getURL();
    const secure = /^https:\/\//i.test(origin);
    const silentAllow = new Set(['clipboard-sanitized-write', 'fullscreen', 'pointerLock']);

    if (!secure) return callback(false);
    if (silentAllow.has(permission)) return callback(true);
    if (permission === 'notifications') return callback(false);
    if (permission === 'media' || permission === 'geolocation') {
      askOneTimePermission(permission, origin, details)
        .then((allowed) => callback(Boolean(allowed)))
        .catch(() => callback(false));
      return;
    }
    callback(false);
  });

  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    if (!/^https:\/\//i.test(requestingOrigin || '')) return false;
    return ['clipboard-sanitized-write', 'fullscreen', 'pointerLock'].includes(permission);
  });

  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const now = Date.now();
    privacyStats.totalRequests += 1;
    requestTimes.push(now);
    while (requestTimes.length && requestTimes[0] < now - 10000) requestTimes.shift();

    const data = readData();
    if (data.settings.httpsFirst && details.resourceType === 'mainFrame' && /^http:\/\//i.test(details.url) && !isLocalHost(details.url)) {
      privacyStats.httpsUpgrades += 1;
      callback({ redirectURL: details.url.replace(/^http:\/\//i, 'https://') });
      return;
    }

    if (data.settings.guardian && requestTimes.length > 350 && now - lastGuardianAlert > 30000) {
      lastGuardianAlert = now;
      sendGuardianAlert({ kind: 'network-burst', count: requestTimes.length, windowMs: 10000, message: 'Cette page génère un volume inhabituel de requêtes réseau.' });
    }

    if (data.settings.blockTrackers && isTracker(details.url) && !isPaymentURL(details.url)) {
      privacyStats.blockedTrackers += 1;
      callback({ cancel: true });
      return;
    }
    callback({});
  });

  ses.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
    const headers = { ...details.requestHeaders, DNT: '1', 'Sec-GPC': '1' };
    callback({ requestHeaders: headers });
  });

  ses.on('will-download', (event, item) => {
    privacyStats.downloadsObserved += 1;
    const filename = item.getFilename();
    const url = item.getURL();
    const ext = path.extname(filename).toLowerCase();
    const risky = DANGEROUS_DOWNLOAD_EXTENSIONS.has(ext);
    const insecure = !/^https:\/\//i.test(url);
    const doubleExtension = /\.(pdf|jpg|jpeg|png|gif|docx?|xlsx?|pptx?|txt)\.(exe|scr|bat|cmd|js|vbs)$/i.test(filename);

    if (risky && (insecure || doubleExtension)) {
      event.preventDefault();
      privacyStats.riskyDownloadsBlocked += 1;
      sendGuardianAlert({ kind: 'download-risk', message: `Téléchargement bloqué : ${filename}`, reason: doubleExtension ? 'double-extension' : 'insecure-executable' });
    }
  });
}

function secureWebContents(contents) {
  setupSessionProtection(contents.session);
  contents.setWindowOpenHandler((details) => {
    const url = details.url;
    if (!/^https?:\/\//i.test(url)) {
      privacyStats.popupsBlocked += 1;
      return { action: 'deny' };
    }
    mainWindow?.webContents.send('open-tab', url, { payment: isPaymentURL(url) });
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (!/^(https?:|file:)/i.test(url)) event.preventDefault();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Flamme',
    backgroundColor: '#11131a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true
    }
  });

  setupSessionProtection(session.defaultSession);
  secureWebContents(mainWindow.webContents);

  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.allowRunningInsecureContent = false;
    if (!/^(https?:|file:)/i.test(params.src || '')) params.src = 'about:blank';
  });
  mainWindow.webContents.on('did-attach-webview', (_event, contents) => secureWebContents(contents));
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');
app.commandLine.appendSwitch('enable-features', 'GlobalPrivacyControlForce,ThirdPartyStoragePartitioning,PartitionedCookies');

app.whenReady().then(() => {
  dataCache = loadDataFromDisk();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('data:get', () => readData());
ipcMain.handle('privacy:stats', () => ({ ...privacyStats }));
ipcMain.handle('history:add', (_event, entry) => {
  if (!entry || typeof entry.url !== 'string' || !/^https?:\/\//i.test(entry.url)) return false;
  const data = readData();
  data.history.unshift({ url: entry.url, title: String(entry.title || entry.url).slice(0, 300), visitedAt: new Date().toISOString() });
  const seen = new Set();
  data.history = data.history.filter((item) => item.url && !seen.has(item.url) && seen.add(item.url)).slice(0, 3000);
  writeData(data);
  return true;
});
ipcMain.handle('bookmark:toggle', (_event, entry) => {
  if (!entry || typeof entry.url !== 'string' || !/^https?:\/\//i.test(entry.url)) return { added: false, bookmarks: [] };
  const data = readData();
  const index = data.bookmarks.findIndex((item) => item.url === entry.url);
  let added = false;
  if (index >= 0) data.bookmarks.splice(index, 1);
  else {
    data.bookmarks.unshift({ url: entry.url, title: String(entry.title || entry.url).slice(0, 300), addedAt: new Date().toISOString(), source: 'Flamme' });
    added = true;
  }
  writeData(data);
  return { added, bookmarks: data.bookmarks };
});
ipcMain.handle('browser:import', async () => {
  const current = readData();
  const result = await importBrowserData(app);
  const seenBookmarks = new Set(current.bookmarks.map((b) => b.url));
  let added = 0;
  for (const bookmark of result.bookmarks) {
    if (bookmark.url && !seenBookmarks.has(bookmark.url)) {
      current.bookmarks.push(bookmark);
      seenBookmarks.add(bookmark.url);
      added++;
    }
  }
  writeData(current);
  return { importedBookmarks: added, sources: result.sources, warnings: result.warnings };
});
ipcMain.handle('settings:update', (_event, patch) => {
  const data = readData();
  const allowed = ['home', 'blockTrackers', 'blockPopups', 'httpsFirst', 'guardian'];
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(patch || {}, key)) data.settings[key] = patch[key];
  writeData(data);
  return data.settings;
});
ipcMain.handle('external:open', (_event, url) => /^https?:\/\//i.test(url) ? shell.openExternal(url) : false);
