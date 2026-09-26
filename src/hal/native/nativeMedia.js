import { IMediaPicker } from '../interfaces/IMediaPicker.js';
import { Camera } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

export class NativeMediaPicker extends IMediaPicker {
  async pickPhotos(options = { multiple: true }) {
    try {
      const result = await Camera.pickImages({
        quality: 95,
        limit: options.multiple ? 0 : 1 // 0 = sin límite en Capacitor
      });

      return (result.photos || []).map((photo) => ({
        uri: photo.webPath,
        format: photo.format
      }));
    } catch (err) {
      console.warn('[NativeMediaPicker] Error seleccionando fotos:', err);
      return [];
    }
  }

  async saveImage(dataUrl, filename = 'collage.jpg') {
    try {
      let base64Data = dataUrl;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }

      const result = await Filesystem.writeFile({
        path: `collages/${filename}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      return { ok: true, uri: result.uri, filename };
    } catch (err) {
      console.error('[NativeMediaPicker] Error guardando imagen en filesystem:', err);
      return { ok: false, filename, error: err.message };
    }
  }
}
