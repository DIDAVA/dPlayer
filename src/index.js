const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 370,
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.removeMenu();
  win.setResizable(false);
  win.loadFile('src/index.html');
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() });
app.on('activate', () => { if (win === null) createWindow() });
app.on('ready', () => createWindow() );