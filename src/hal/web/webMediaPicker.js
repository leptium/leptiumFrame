import { IMediaPicker } from '../interfaces/IMediaPicker.js';

export class WebMediaPicker extends IMediaPicker {
  async pickPhotos(options = { multiple: true }) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = options.multiple !== false;

      input.onchange = () => {
        if (!input.files || input.files.length === 0) {
          resolve([]);
          return;
        }

        const results = Array.from(input.files).map((file) => ({
          uri: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
          fileRef: file
        }));
        resolve(results);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async saveImage(dataUrl, filename = 'collage.jpg') {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // En dispositivos táctiles / móviles, priorizar Web Share API con archivos (permite guardar en Carrete iOS/Android o compartir)
      const isTouchDevice = typeof window !== 'undefined' && (
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );

      if (isTouchDevice && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof File !== 'undefined') {
        try {
          const file = new File([blob], filename, { type: 'image/jpeg' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'leptium FenixFrame'
            });
            return { ok: true, filename };
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            return { ok: false, error: 'Guardado cancelado por el usuario' };
          }
          // Fallback si falla Web Share API
        }
      }

      // Si la API File System Access está disponible en navegadores de escritorio modernos
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JPEG Image',
              accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return { ok: true, filename };
        } catch (pickerErr) {
          if (pickerErr.name === 'AbortError') {
            return { ok: false, error: 'Guardado cancelado por el usuario' };
          }
          // Fallback al método tradicional de descarga si falla
        }
      }

      // Método universal compatible: descarga vía elemento ancla
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      return { ok: true, filename };
    } catch (err) {
      console.error('[WebMediaPicker] Error al guardar imagen:', err);
      return { ok: false, filename, error: err.message };
    }
  }
}
