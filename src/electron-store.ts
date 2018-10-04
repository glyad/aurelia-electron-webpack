import { PLATFORM } from 'aurelia-pal';
import { CallingAction, MiddlewarePlacement, Reducer, Store, StoreOptions } from 'aurelia-store';
import { ipcMain, ipcRenderer, webContents } from 'electron';

PLATFORM.performance = {
  clearMarks: () => undefined,
  clearMeasures: () => undefined,
  mark: () => undefined,
  now: () => 0
} as any;

const ACTION_SET_STATE = 'set-state-from-other-process';
const IPC_KEY = 'aurelia-store-action';

export function deepClone<T>(obj: T | Readonly<T>): T {
  return JSON.parse(JSON.stringify(obj));
}

async function setStateFromIPC<T>(state: Readonly<T>, newState: T): Promise<T | false> {
  // its already been serialised/deserialised
  return newState;
}

async function toMainMiddleware<T>(state: T, o?: T, s?: any, action?: CallingAction): Promise<T> {
  // We dont want to send to the main process if its just been set from the main
  // process as this would cause an infinite loop
  if (action!.name !== ACTION_SET_STATE) {
    ipcRenderer.send(IPC_KEY, ACTION_SET_STATE, state);
  }
  return state;
}

function toRendererMiddleware<T>(state: any, o?: T, s?: any, action?: CallingAction) {
  // Avoid infinite loop
  if (action!.name !== ACTION_SET_STATE) {
    for (const contents of webContents.getAllWebContents()) {
      contents.send(IPC_KEY, ACTION_SET_STATE, state);
    }
  }

  return state;
}

export class ElectronStore<T> extends Store<T> {
  constructor(initialState: T, options?: Partial<StoreOptions>) {
    super(initialState, options);

    if (process.type === 'renderer') {
      this.registerMiddleware(toMainMiddleware, MiddlewarePlacement.After);
      // Listen for actions from the main process
      ipcRenderer.on(IPC_KEY, (_: Electron.Event, action: string, ...params: any[]) => {
        this.dispatch(action, ...params);
      });
    } else {
      this.registerMiddleware(toRendererMiddleware, MiddlewarePlacement.After);
      // Listen for actions from a renderer process
      ipcMain.on(IPC_KEY, (_: Electron.Event, action: string, ...params: any[]) => {
        this.dispatch(action, ...params);
      });
    }

    this.registerAction(ACTION_SET_STATE, setStateFromIPC);
  }

  public async dispatch<P extends any[]>(action: string, ...params: P): Promise<void> {
    if (this.isActionRegistered(action)) {
      return super.dispatch(action, ...params);
    }

    // if we can't find the action, send it to the other processes
    if (process.type === 'renderer') {
      ipcRenderer.send(IPC_KEY, action, ...params);
    } else {
      for (const contents of webContents.getAllWebContents()) {
        contents.send(IPC_KEY, action, ...params);
      }
    }
  }
}
