import { IWakeLock } from '../interfaces/IWakeLock.js';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App } from '@capacitor/app';

export class NativeWakeLock extends IWakeLock {
  constructor() {
    super();
    this.isActive = false;

    // Liberar KeepAwake si la app pasa a segundo plano para ahorrar batería y no ser penalizado por iOS/Android
    try {
      App.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) {
          await this._allowSleepSilent();
        } else if (this.isActive) {
          await this.enable();
        }
      });
    } catch (e) {
      console.warn('[NativeWakeLock] Error configurando App listener:', e);
    }
  }

  async isSupported() {
    return true;
  }

  async enable() {
    this.isActive = true;
    try {
      await KeepAwake.keepAwake();
    } catch (e) {
      console.warn('[NativeWakeLock] Error en keepAwake:', e);
    }
  }

  async disable() {
    this.isActive = false;
    await this._allowSleepSilent();
  }

  async _allowSleepSilent() {
    try {
      await KeepAwake.allowSleep();
    } catch (e) {
      console.warn('[NativeWakeLock] Error en allowSleep:', e);
    }
  }
}
