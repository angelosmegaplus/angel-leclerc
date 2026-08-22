const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { importBrowserData } = require('./import-data');

let mainWindow;

function dataFile() {
  return path.join(app.getPath('userData'), 'flamingbox-data.json');
}

function defaultData() {
  return {
    bookmarks: [],
    history: [],
    settings: {
      home: 'https://www.google.com/',
      search: 'https://www.google.com/search?q=%s',
      telemetry: false
    }
  };
}

function readData() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8');
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

function writeData(data) {
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'FlamingBox',
    backgroundColor: '#11131a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    mainWindow.webContents.send('open-tab', url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
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
  data.history.unshift({
    url: entry.url,
    title: String(entry.title || entry.url).slice(0, 300),
    visitedAt: new Date().toISOString()
  });
  data.history = data.history.slice(0, 3000);
  writeData(data);
  return true;
});

ipcMain.handle('bookmark:toggle', (_event, entry) => {
  if (!entry || typeof entry.url !== 'string') return { added: false, bookmarks: [] };
  const data = readData();
  const index = data.bookmarks.findIndex((item) => item.url === entry.url);
  let added = false;

  if (index >= 0) {
    data.bookmarks.splice(index, 1);
  } else {
    data.bookmarks.unshift({
      url: entry.url,
      title: String(entry.title || entry.url).slice(0, 300),
      addedAt: new Date().toISOString(),
      source: 'FlamingBox'
    });
    added = true;
  }

  writeData(data);
  return { added, bookmarks: data.bookmarks };
});

ipcMain.handle('browser:import', async () => {
  const current = readData();
  const result = await importBrowserData(app);
  const seenBookmarks = new Set(current.bookmarks.map((b) => b.url));

  for (const bookmark of result.bookmarks) {
    if (bookmark.url && !seenBookmarks.has(bookmark.url)) {
      current.bookmarks.push(bookmark);
      seenBookmarks.add(bookmark.url);
    }
  }

  writeData(current);
  return {
    importedBookmarks: result.bookmarks.length,
    sources: result.sources,
    warnings: result.warnings
  };
});

ipcMain.handle('external:open', (_event, url) => {
  if (/^https?:\/\//i.test(url)) return shell.openExternal(url);
  return false;
});
