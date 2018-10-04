import 'reflect-metadata';

import { bootstrap } from 'aurelia-bootstrapper';
import { Aurelia } from 'aurelia-framework';
import { Store } from 'aurelia-store';
import { App } from './app';
import { ElectronStore } from './electron-store';
import environment from './environment';
import { IState } from './state';

bootstrap(async (aurelia: Aurelia) => {
  aurelia.use.standardConfiguration();

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  const store = new ElectronStore<IState>({ devices: [] });
  aurelia.container.registerInstance(Store, store);

  return aurelia.start().then(() => aurelia.setRoot(App, document.body));
});
