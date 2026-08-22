const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flamingbox', {
  getData: () => ipcRenderer.invoke('data:get'),
  addHistory: (entry) => ipcRenderer.invoke('history:add', entry),
  toggleBookmark: (entry) => ipcRenderer.invoke('bookmark:toggle', entry),
  importBrowserData: () => ipcRenderer.invoke('browser:import'),
  openExternal: (url) => ipcRenderer.invoke('external:open', url),
  onOpenTab: (callback) => ipcRenderer.on('open-tab', (_event, url) => callback(url))
});
