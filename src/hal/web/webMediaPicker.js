import { IMediaPicker } from '../interfaces/IMediaPicker.js';

function dataUrlToBlob(dataUrl) {
  const parts = String(dataUrl).split(',');
  const header = parts[0] || '';
  const base64 = parts[1] || '';
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

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

  async saveImage(source, filename = 'collage.jpg') {
    try {
      let blob = null;
      if (source instanceof Blob) {
        blob = source;
      } else if (typeof source === 'string' && source.startsWith('data:')) {
        blob = dataUrlToBlob(source);
      }

      if (!blob) {
        throw new Error('No se pudo obtener el binario de la imagen');
      }

      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      // En dispositivos táctiles / móviles, priorizar Web Share API si está soportada
      const isTouchDevice =
        typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches ||
          'ontouchstart' in window ||
          navigator.maxTouchPoints > 0);

      if (
        isTouchDevice &&
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'leptium FenixFrame',
            text: 'Collage generado desde mi lienzo digital.'
          });
          return { ok: true, filename };
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            return { ok: false, error: 'Guardado cancelado por el usuario' };
          }
        }
      }

      // Fallback universal: Descarga directa con URL temporal de objeto
      const tempUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = tempUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(tempUrl), 1000);

      return { ok: true, filename };
    } catch (err) {
      console.error('[WebMediaPicker] Error al guardar imagen:', err);
      return { ok: false, filename, error: err.message };
    }
  }
}
