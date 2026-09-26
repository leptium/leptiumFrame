import { Capacitor } from '@capacitor/core';
import { WebWakeLock } from './web/webWakeLock.js';
import { NativeWakeLock } from './native/nativeWakeLock.js';
import { WebStorage } from './web/webStorage.js';
import { NativeStorage } from './native/nativeStorage.js';
import { WebMediaPicker } from './web/webMediaPicker.js';
import { NativeMediaPicker } from './native/nativeMedia.js';

const isNative = Capacitor.isNativePlatform();

export const WakeLock = isNative ? new NativeWakeLock() : new WebWakeLock();
export const Storage = isNative ? new NativeStorage() : new WebStorage();
export const MediaPicker = isNative ? new NativeMediaPicker() : new WebMediaPicker();
export { isNative };
