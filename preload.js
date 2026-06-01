const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('skyAPI', {
  showWindow: () => ipcRenderer.send('sky-show'),
  hideWindow: () => ipcRenderer.send('sky-hide'),
});
