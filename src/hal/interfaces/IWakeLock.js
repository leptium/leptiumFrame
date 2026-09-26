/**
 * @interface IWakeLock
 * Contrato para evitar el apagado de la pantalla en modo marco de fotos.
 */
export class IWakeLock {
  /**
   * Activa el bloqueo para mantener la pantalla encendida.
   * @returns {Promise<void>}
   */
  async enable() {
    throw new Error('IWakeLock.enable() no implementado');
  }

  /**
   * Libera el bloqueo para permitir que el sistema ahorre energía.
   * @returns {Promise<void>}
   */
  async disable() {
    throw new Error('IWakeLock.disable() no implementado');
  }

  /**
   * Verifica si la plataforma soporta control de pantalla activa.
   * @returns {Promise<boolean>}
   */
  async isSupported() {
    throw new Error('IWakeLock.isSupported() no implementado');
  }
}
