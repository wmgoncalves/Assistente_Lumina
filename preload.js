const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('luminaAPI', {
  showWindow:  () => ipcRenderer.send('lumina-show'),
  hideWindow:  () => ipcRenderer.send('lumina-hide'),
  runCommand:  (action, args) => ipcRenderer.invoke('lumina-cmd', action, args),
});
