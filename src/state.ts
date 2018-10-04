import * as usbDetect from 'usb-detection';

export interface IState {
  devices: usbDetect.Device[];
}
