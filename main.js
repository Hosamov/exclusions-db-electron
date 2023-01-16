// Import required electron modules:
const { app, BrowserWindow } = require('electron');
// app: controls app's lifecycle
// BrowserWindow: creates and manages app windows

const server = require('./app');

let mainWindow;
// load web page into new BrowserWindow instance:
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width:1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
    }
  })
  mainWindow.loadURL('http://localhost:3000');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Call function when app is ready:
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("resize", function (e, x, y) {
  mainWindow.setSize(x, y);
});

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit()
});

