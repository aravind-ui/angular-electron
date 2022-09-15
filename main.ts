import {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcRenderer,
  ipcMain,
  IpcMessageEvent,
  crashReporter,
  autoUpdater,
  dialog,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as log from 'electron-log';
let win: BrowserWindow;
require('update-electron-app')({
  repo: 'https://github.com/aravind-ui/angular-electron',
  updateInterval: '1 hour',
  logger: require('electron-log'),
});
const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');

function createWindow(): BrowserWindow {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    frame: false,
    width: size.width,
    height: size.height,
    autoHideMenuBar: true,
    kiosk: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      allowRunningInsecureContent: serve ? true : false,
      webSecurity: false,
      plugins: true,
    },
    show: false,
  });

  // Show window only when it's ready
  win.once('ready-to-show', () => {
    console.log('ready-to-show fired!!');
    win.show();
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http:localhost:4200');
    const isOSX = process.platform === 'darwin';
    if (!isOSX) {
      win.setIcon(path.join(__dirname + '/src/assets/icons/win/app.png'));
    }
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'www/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    win.setKiosk(true);
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // disable cache
  win.webContents.session.clearCache();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win.close();
  });
  return win;
}

function listenForRelaunch() {
  ipcMain.on('relaunch-application', (event, command) => {
    // Issue the Relaunch commands
    app.relaunch();
    app.exit(0);
  });
}

function listenForReload() {
  ipcMain.on('reload-application', (event, command) => {
    if (serve) {
      win.loadURL('http://locahost:4200');
    } else {
      win.loadURL(
        url.format({
          pathname: path.join(__dirname, 'www/index.html'),
          protocol: 'file:',
          slashes: true,
        })
      );
    }
  });
}
try {
  // Disable Hardware Acceleration and Enable Software
  app.disableHardwareAcceleration();

  // Load Pepper Flash Plugin
  app.commandLine.appendSwitch(
    'ppapi-flash-path',
    path.join(__dirname, 'plugins/pepperflashplugin.dll')
  );

  app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
  // Allow CORS
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

  // Request for single instance lock
  const isLocked = app.requestSingleInstanceLock();
  if (!isLocked) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // app.on('ready', createWindow);
  app.on('ready', function () {
    var keySender;
    createWindow();

    ipcMain.on('set-sender-detail', (event: any) => {
      keySender = event.sender;
    });
    listenForRelaunch();
    listenForReload();
  });

  // Quit when all windows are closed.

  app.on('before-quit', () => {
    win.removeAllListeners('close');
    win.close();
  });

  app.on('render-process-gone', (e, details) => {
    console.log(e, 'details', details);
    app.relaunch();
    app.exit(0);
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
  app.setPath('crashDumps', '/CrashPad/reports');
} catch (e) {
  // Catch Error
  // throw e;
}

const crashReportingConfig = {
  uploadToServer: false,
  productName: 'Trilogy Enrollment',
  companyName: 'Everi',
  submitURL: '',
};
crashReporter.start(crashReportingConfig);

const server = 'http://127.0.0.1:8887';
const serverUrl = `${server}/${app.getVersion()}`;
console.log('serverUrl', serverUrl);
log.info('serverUrl', serverUrl);
autoUpdater.setFeedURL({ url: serverUrl });

autoUpdater.on('update-available', () => {
  log.info('update available');
});
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail:
      'A new version has been downloaded. Restart the application to apply the updates.',
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (message) => {
  log.error('There was a problem updating the application');
  log.error(message);
});

setInterval(() => {
  log.info('checking for update');
  autoUpdater.checkForUpdates();
}, 10000);
