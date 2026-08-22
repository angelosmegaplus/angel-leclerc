const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flamingbox', Object.freeze({
  getData: () => ipcRenderer.invoke('data:get'),
  addHistory: (entry) => ipcRenderer.invoke('history:add', entry),
  toggleBookmark: (entry) => ipcRenderer.invoke('bookmark:toggle', entry),
  importBrowserData: () => ipcRenderer.invoke('browser:import'),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  openExternal: (url) => ipcRenderer.invoke('external:open', url),
  onOpenTab: (callback) => ipcRenderer.on('open-tab', (_event, url, meta) => callback(url, meta || {})),
  onGuardianAlert: (callback) => ipcRenderer.on('guardian:alert', (_event, payload) => callback(payload || {}))
}));
