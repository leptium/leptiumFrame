/**
 * Motor conversor de imagenes a Arte ASCII en memoria.
 * 100% Vanilla JS, cero dependencias externas, liberacion inmediata de buffers Canvas.
 */

export const ASCII_RAMP = ' .:-=+*#%@';

/**
 * Convierte una imagen (Image, HTMLImageElement o ImageBitmap) a arte ASCII.
 * @param {HTMLImageElement|ImageBitmap} imgElement - Imagen fuente ya cargada.
 * @param {number} [width=80] - Ancho en columnas de caracteres (por defecto 80 para consola).
 * @param {number} [contrast=1.0] - Ajuste de contraste opcional.
 * @returns {string} Texto ASCII formateado con saltos de linea.
 */
export function convertImageToAscii(imgElement, width = 80, contrast = 1.0) {
  if (!imgElement) return '';

  const srcWidth = imgElement.naturalWidth || imgElement.width || 0;
  const srcHeight = imgElement.naturalHeight || imgElement.height || 0;
  if (!srcWidth || !srcHeight) return '';

  // Las fuentes monospace tienen una relacion de aspecto de ~1:2 (mas altas que anchas),
  // por lo que ajustamos la altura al 50% de la proporcion para que no se vea estirada.
  const aspectRatio = srcHeight / srcWidth;
  const height = Math.max(1, Math.round(width * aspectRatio * 0.5));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) return '';

  ctx.drawImage(imgElement, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height).data;

  let asciiOutput = '';
  const rampLen = ASCII_RAMP.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const alpha = imgData[idx + 3];

      if (alpha < 50) {
        asciiOutput += ' ';
        continue;
      }

      // Formula de luminancia estandar
      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      // Ajuste de contraste sutil si aplica
      if (contrast !== 1.0) {
        brightness = Math.min(255, Math.max(0, (brightness - 128) * contrast + 128));
      }

      const charIdx = Math.floor((brightness / 255) * (rampLen - 1));
      asciiOutput += ASCII_RAMP[charIdx];
    }
    asciiOutput += '\n';
  }

  // Liberar el canvas para cuidar la memoria
  canvas.width = 0;
  canvas.height = 0;

  return asciiOutput;
}
