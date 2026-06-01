const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');

let win = null;

const WIN_W = 1100;
const WIN_H = 720;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width:  WIN_W,
    height: WIN_H,
    x: Math.floor((width  - WIN_W) / 2),
    y: Math.floor((height - WIN_H) / 2),
    frame:       false,
    alwaysOnTop: true,
    resizable:   true,
    skipTaskbar: false,
    show:        true,
    backgroundColor: '#0a0303',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // ESC esconde a janela
  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') win.hide();
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('F6', () => {
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());

// Mantém o app rodando mesmo sem janelas visíveis
app.on('window-all-closed', (e) => e.preventDefault());
