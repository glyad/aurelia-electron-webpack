import 'reflect-metadata';

import { app, BrowserWindow } from 'electron';
import * as usbDetect from 'usb-detection';
import { deepClone, ElectronStore } from './electron-store';
import { IState } from './state';

let mainWindow: Electron.BrowserWindow | undefined;

function createWindow() {
  // Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({ width: 800, height: 600 });
  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});

export async function refreshDevices(state: Readonly<IState>) {
  const newState = deepClone<IState>(state);
  newState.devices = await usbDetect.find();
  return newState;
}

const store = new ElectronStore<IState>({ devices: [] });
store.registerAction('refresh-devices', refreshDevices);
