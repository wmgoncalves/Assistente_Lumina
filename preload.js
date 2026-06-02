const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('skyAPI', {
  showWindow:  () => ipcRenderer.send('sky-show'),
  hideWindow:  () => ipcRenderer.send('sky-hide'),
  runCommand:  (action, args) => ipcRenderer.invoke('sky-cmd', action, args),
});
