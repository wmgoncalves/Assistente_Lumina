const { app, BrowserWindow, globalShortcut, screen, shell, ipcMain } = require('electron');
const { fork } = require('child_process');
const path = require('path');

let win = null;
let server = null;

function startServer() {
  return new Promise((resolve) => {
    server = fork(path.join(__dirname, 'server.js'), [], { silent: true });
    server.stdout.on('data', (d) => { if (d.toString().includes('localhost')) resolve(); });
    server.stderr.on('data', () => {});
    setTimeout(resolve, 2000);
  });
}

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
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // Permite microfone e câmera sem HTTPS no localhost
  win.webContents.session.setPermissionRequestHandler((_, permission, callback) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'videoCapture', 'camera'];
    callback(allowed.includes(permission));
  });
  win.webContents.session.setPermissionCheckHandler((_, permission) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'videoCapture', 'camera'];
    return allowed.includes(permission);
  });

  // Abre links externos no browser padrão do sistema (Chrome, Edge, etc)
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Mantém JS rodando mesmo com janela escondida (necessário pro wake word)
  win.webContents.setBackgroundThrottling(false);

  // Limpa cache para sempre carregar o código mais recente
  win.webContents.session.clearCache().then(() => {
    win.loadURL('http://localhost:8080');
  });

  // ESC esconde a janela
  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') win.hide();
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();
  });
}

app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI');
app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'http://localhost:8080');

// IPC — renderer pede pra mostrar/esconder janela (wake word)
ipcMain.on('sky-show', () => { if (win) { win.show(); win.focus(); } });
ipcMain.on('sky-hide', () => { if (win) win.hide(); });

app.whenReady().then(async () => {
  await startServer();
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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (server) server.kill();
});

// Mantém o app rodando mesmo sem janelas visíveis
app.on('window-all-closed', (e) => e.preventDefault());
