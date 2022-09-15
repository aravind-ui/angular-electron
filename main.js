"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var log = require("electron-log");
var win;
var args = process.argv.slice(1), serve = args.some(function (val) { return val === '--serve'; });
function createWindow() {
    var electronScreen = electron_1.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    win = new electron_1.BrowserWindow({
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
    win.once('ready-to-show', function () {
        console.log('ready-to-show fired!!');
        win.show();
    });
    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require("".concat(__dirname, "/node_modules/electron")),
        });
        win.loadURL('http:localhost:4200');
        var isOSX = process.platform === 'darwin';
        if (!isOSX) {
            win.setIcon(path.join(__dirname + '/src/assets/icons/win/app.png'));
        }
    }
    else {
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'www/index.html'),
            protocol: 'file:',
            slashes: true,
        }));
        win.setKiosk(true);
    }
    if (serve) {
        win.webContents.openDevTools();
    }
    // disable cache
    win.webContents.session.clearCache();
    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win.close();
    });
    return win;
}
function listenForRelaunch() {
    electron_1.ipcMain.on('relaunch-application', function (event, command) {
        // Issue the Relaunch commands
        electron_1.app.relaunch();
        electron_1.app.exit(0);
    });
}
function listenForReload() {
    electron_1.ipcMain.on('reload-application', function (event, command) {
        if (serve) {
            win.loadURL('http://locahost:4200');
        }
        else {
            win.loadURL(url.format({
                pathname: path.join(__dirname, 'www/index.html'),
                protocol: 'file:',
                slashes: true,
            }));
        }
    });
}
try {
    // Disable Hardware Acceleration and Enable Software
    electron_1.app.disableHardwareAcceleration();
    // Load Pepper Flash Plugin
    electron_1.app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, 'plugins/pepperflashplugin.dll'));
    electron_1.app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
    // Allow CORS
    electron_1.app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    // Request for single instance lock
    var isLocked = electron_1.app.requestSingleInstanceLock();
    if (!isLocked) {
        electron_1.app.quit();
    }
    else {
        electron_1.app.on('second-instance', function (event, commandLine, workingDirectory) {
            // Someone tried to run a second instance, we should focus our window.
            if (win) {
                if (win.isMinimized())
                    win.restore();
                win.focus();
            }
        });
    }
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // app.on('ready', createWindow);
    electron_1.app.on('ready', function () {
        var keySender;
        createWindow();
        electron_1.ipcMain.on('set-sender-detail', function (event) {
            keySender = event.sender;
        });
        listenForRelaunch();
        listenForReload();
    });
    // Quit when all windows are closed.
    electron_1.app.on('before-quit', function () {
        win.removeAllListeners('close');
        win.close();
    });
    electron_1.app.on('render-process-gone', function (e, details) {
        console.log(e, 'details', details);
        electron_1.app.relaunch();
        electron_1.app.exit(0);
    });
    electron_1.app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
    electron_1.app.setPath('crashDumps', '/CrashPad/reports');
}
catch (e) {
    // Catch Error
    // throw e;
}
var crashReportingConfig = {
    uploadToServer: false,
    productName: 'Trilogy Enrollment',
    companyName: 'Everi',
    submitURL: '',
};
electron_1.crashReporter.start(crashReportingConfig);
var server = 'http://127.0.0.1:8887';
var serverUrl = "".concat(server, "/").concat(electron_1.app.getVersion());
console.log('serverUrl', serverUrl);
log.info('serverUrl', serverUrl);
electron_1.autoUpdater.setFeedURL({ url: serverUrl });
electron_1.autoUpdater.on('update-available', function () {
    log.info('update available');
});
electron_1.autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName) {
    var dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.',
    };
    electron_1.dialog.showMessageBox(dialogOpts).then(function (returnValue) {
        if (returnValue.response === 0)
            electron_1.autoUpdater.quitAndInstall();
    });
});
electron_1.autoUpdater.on('error', function (message) {
    log.error('There was a problem updating the application');
    log.error(message);
});
setInterval(function () {
    log.info('checking for update');
    electron_1.autoUpdater.checkForUpdates();
}, 10000);
//# sourceMappingURL=main.js.map