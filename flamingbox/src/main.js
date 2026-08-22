const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { importBrowserData } = require('./import-data');

let mainWindow;
let dataCache = null;

const TRACKER_HOSTS = [
  'doubleclick.net', 'googlesyndication.com', 'google-analytics.com', 'googletagmanager.com',
  'connect.facebook.net', 'facebook.net', 'scorecardresearch.com', 'hotjar.com', 'segment.io',
  'mixpanel.com', 'adnxs.com', 'criteo.com', 'taboola.com', 'outbrain.com', 'branch.io',
  'app-measurement.com', 'adjust.com'
];

const PAYMENT_HOST_HINTS = [
  'paypal.com', 'stripe.com', 'stripe.network', 'adyen.com', 'checkout.com', 'klarna.com',
  'amazonpay.com', 'pay.google.com', 'payments.google.com', 'paylib.fr', 'lyra.com',
  'monext.fr', 'worldline.com', 'sips-services.com', '3dsecure', 'secure-payment', 'payment'
];

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

function dataFile() {
  return path.join(app.getPath('userData'), 'angel-os', 'flamingbox-data.json');
}

function defaultData() {
  return {
    bookmarks: [],
    history: [],
    settings: {
      home: 'https://www.google.com/',
      search: 'https://www.google.com/search?q=%s',
      telemetry: false,
      blockTrackers: true,
      blockPopups: true,
      httpsFirst: true,
      angelOSKernel: true
    }
  };
}

function loadDataFromDisk() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed, settings: { ...defaultData().settings, ...(parsed.settings || {}) } };
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

function setupSessionProtection(ses) {
  if (ses.__flamingBoxHardened) return;
  ses.__flamingBoxHardened = true;

  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const origin = details?.requestingUrl || webContents.getURL();
    const secure = /^https:\/\//i.test(origin);
    const safePermissions = new Set(['clipboard-sanitized-write', 'fullscreen', 'pointerLock']);
    callback(Boolean(secure && safePermissions.has(permission)));
  });

  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    if (!/^https:\/\//i.test(requestingOrigin || '')) return false;
    return ['clipboard-sanitized-write', 'fullscreen', 'pointerLock'].includes(permission);
  });

  // Hot path: never touch disk here. readData() is an in-memory cache after startup.
  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const settings = readData().settings;
    if (settings.blockTrackers && isTracker(details.url) && !isPaymentURL(details.url)) {
      callback({ cancel: true });
      return;
    }
    callback({});
  });

  ses.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
    const headers = { ...details.requestHeaders, DNT: '1', 'Sec-GPC': '1' };
    callback({ requestHeaders: headers });
  });
}

function secureWebContents(contents) {
  setupSessionProtection(contents.session);

  contents.setWindowOpenHandler((details) => {
    const url = details.url;
    if (!/^https?:\/\//i.test(url)) return { action: 'deny' };

    if (isPaymentURL(url)) {
      mainWindow?.webContents.send('open-tab', url, { payment: true });
      return { action: 'deny' };
    }

    if (details.disposition === 'foreground-tab' || details.disposition === 'background-tab' || details.disposition === 'new-window') {
      mainWindow?.webContents.send('open-tab', url, { payment: false });
    }
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
    title: 'FlamingBox — Angel OS',
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
app.commandLine.appendSwitch('enable-features', 'ThirdPartyStoragePartitioning,PartitionedCookies');

app.whenReady().then(() => {
  dataCache = loadDataFromDisk();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('data:get', () => readData());

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
    data.bookmarks.unshift({ url: entry.url, title: String(entry.title || entry.url).slice(0, 300), addedAt: new Date().toISOString(), source: 'FlamingBox' });
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
  const allowed = ['home', 'blockTrackers', 'blockPopups', 'httpsFirst'];
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(patch || {}, key)) data.settings[key] = patch[key];
  writeData(data);
  return data.settings;
});

ipcMain.handle('external:open', (_event, url) => {
  if (/^https?:\/\//i.test(url)) return shell.openExternal(url);
  return false;
});
