const { app, BrowserWindow, globalShortcut, screen, shell, ipcMain, Tray, Menu, nativeImage } = require('electron');
const { fork, exec } = require('child_process');
const path = require('path');

// ── Comandos do sistema (lista branca segura) ─────────────────────────────────
const SYS_COMMANDS = {
  lock:        () => exec('rundll32.exe user32.dll,LockWorkStation'),
  sleep:       () => exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0'),
  shutdown:    () => exec('shutdown /s /t 30'),
  restart:     () => exec('shutdown /r /t 30'),
  mute:        () => exec('powershell -c "(New-Object -com WScript.Shell).SendKeys([char]173)"'),
  volume_up:   () => exec('powershell -c "for($i=0;$i -lt 5;$i++){(New-Object -com WScript.Shell).SendKeys([char]175)}"'),
  volume_down: () => exec('powershell -c "for($i=0;$i -lt 5;$i++){(New-Object -com WScript.Shell).SendKeys([char]174)}"'),
  screenshot:  () => exec('powershell -c "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'%{PRTSC}\')"'),
  cancel_shutdown: () => exec('shutdown /a'),
};

let win    = null;
let server = null;
let tray   = null;

function killPort(port) {
  return new Promise(resolve => {
    exec(
      `powershell -c "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
      () => resolve()
    );
  });
}

async function startServer() {
  await killPort(8080);
  return new Promise((resolve) => {
    server = fork(path.join(__dirname, 'server.js'), [], { silent: true });
    server.stdout.on('data', (d) => { if (/http:\/\/(127\.0\.0\.1|localhost):8080/.test(d.toString())) resolve(); });
    server.stderr.on('data', () => {});
    setTimeout(resolve, 2000);
  });
}

// Ícone 16x16 vermelho para o tray (base64 PNG)
const TRAY_ICON_B64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFJSURBVDiNpZMxSsRAEIa/2WwWFCwFD+AJLCwEPS9gIXgBwVIQL+ApbG0FC/EEHsDKC1hYiYWFhYuIhVhYiJuQzb4fiye7u4mJYGDgMfP/M/MyM4L/JgIgqYwxEZB57UlyFpEzkBpJkiQ55/wA4Jz7BvABYIwx1lp7UkpJKaW01rLWWq21Xmut9zHGewDMbLTWOuccgIjIiIiIiIjIiIiIiIioqo6q+lVVf1T1V1V3VXVHVXdUdUdVd1R1R1V3VHVHVQ==';

const WIN_W = 1100;
const WIN_H = 720;

function createTray() {
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_B64}`).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Lúmina — Clique para mostrar');
  tray.on('click', toggleWindow);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mostrar Lúmina', click: () => showWindow() },
    { label: 'Esconder',     click: () => win?.hide() },
    { type: 'separator' },
    { label: 'Iniciar com Windows', type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { type: 'separator' },
    { label: 'Sair',         click: () => { app.quit(); } },
  ]));
}

function showWindow() {
  if (!win) return;
  win.show();
  win.focus();
}

function toggleWindow() {
  if (!win) return;
  win.isVisible() ? win.hide() : showWindow();
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width:  WIN_W,
    height: WIN_H,
    x: Math.floor((width  - WIN_W) / 2),
    y: Math.floor((height - WIN_H) / 2),
    frame:        false,
    alwaysOnTop:  true,
    resizable:    true,
    skipTaskbar:  true,   // não aparece na barra de tarefas
    show:         false,  // inicia escondida
    backgroundColor: '#0a0303',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  const isLuminaOrigin = (url = '') => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname) && u.port === '8080';
    } catch {
      return false;
    }
  };

  win.webContents.session.setPermissionRequestHandler((_, permission, callback, details = {}) => {
    const allowedPermission = ['media','microphone','audioCapture','videoCapture','camera'].includes(permission);
    const allowedOrigin = isLuminaOrigin(details.requestingUrl || details.embeddingOrigin || details.securityOrigin);
    callback(allowedPermission && allowedOrigin);
  });
  win.webContents.session.setPermissionCheckHandler((_, permission, requestingOrigin) => {
    return ['media','microphone','audioCapture','videoCapture','camera'].includes(permission) && isLuminaOrigin(requestingOrigin);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (['http:', 'https:', 'mailto:'].includes(u.protocol)) shell.openExternal(url);
    } catch (_) {}
    return { action: 'deny' };
  });
  win.webContents.setBackgroundThrottling(false);

  win.webContents.session.clearCache().then(() => win.loadURL('http://127.0.0.1:8080'));

  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') win.hide();
    // Ctrl+R ou F5 — recarrega só o frontend (app.js, CSS) sem reiniciar o servidor
    if (input.type === 'keyDown' && (input.key === 'F5' || (input.key === 'r' && input.control))) {
      win.webContents.reload();
    }
  });

  win.on('close', (e) => { e.preventDefault(); win.hide(); });
}

try {
  app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI');
  app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'http://127.0.0.1:8080');
} catch (_) {}

ipcMain.on('lumina-show', () => showWindow());
ipcMain.on('lumina-hide', () => win?.hide());

ipcMain.handle('lumina-cmd', (_, action) => {
  const cmd = SYS_COMMANDS[action];
  if (!cmd) return { ok: false, error: 'Comando desconhecido: ' + action };
  try { cmd(); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});

app.whenReady().then(async () => {
  await startServer();
  createWindow();
  createTray();

  // Ativa wake word automaticamente ao iniciar
  setTimeout(() => {
    win.webContents.executeJavaScript('if(typeof startWakeWord==="function" && !wakeActive) startWakeWord()').catch(() => {});
  }, 3000);

  globalShortcut.register('F6', toggleWindow);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (server) server.kill();
});

app.on('window-all-closed', (e) => e.preventDefault());
