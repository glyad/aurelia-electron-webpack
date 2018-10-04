import { autoinject } from 'aurelia-framework';
import { Store } from 'aurelia-store';
import { Subscription } from 'rxjs';
import { IState } from './state';

@autoinject
export class App {
  public state?: IState;
  private subscription?: Subscription;

  constructor(private store: Store<IState>) {}

  public bind() {
    this.subscription = this.store.state.subscribe(state => {
      this.state = state;
    });
  }

  public unbind() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public refresh() {
    this.store.dispatch('refresh-devices');
  }
}
