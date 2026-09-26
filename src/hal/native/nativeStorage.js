import { IStorage } from '../interfaces/IStorage.js';
import { Preferences } from '@capacitor/preferences';

export class NativeStorage extends IStorage {
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.warn('[NativeStorage] Error al leer clave:', key, e);
      return null;
    }
  }

  async set(key, value) {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (e) {
      console.warn('[NativeStorage] Error al guardar clave:', key, e);
    }
  }

  async remove(key) {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      console.warn('[NativeStorage] Error al eliminar clave:', key, e);
    }
  }

  async listKeys() {
    try {
      const { keys } = await Preferences.keys();
      return keys || [];
    } catch (e) {
      console.warn('[NativeStorage] Error al listar claves:', e);
      return [];
    }
  }
}
