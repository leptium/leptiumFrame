/**
 * @interface IMediaPicker
 * Contrato para selección y guardado de imágenes (reemplaza servidores locales).
 */
export class IMediaPicker {
  /**
   * Abre el selector nativo o web de fotos.
   * @param {Object} options
   * @param {boolean} [options.multiple=true]
   * @returns {Promise<Array<{ uri: string, name?: string }>>}
   */
  async pickPhotos(options = { multiple: true }) {
    throw new Error('IMediaPicker.pickPhotos() no implementado');
  }

  /**
   * Guarda una imagen (Base64 DataURL o Blob) en el dispositivo.
   * @param {string} dataUrl
   * @param {string} filename
   * @returns {Promise<{ ok: boolean, filename: string, error?: string }>}
   */
  async saveImage(dataUrl, filename) {
    throw new Error('IMediaPicker.saveImage() no implementado');
  }
}
