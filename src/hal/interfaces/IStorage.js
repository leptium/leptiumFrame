/**
 * @interface IStorage
 * Contrato para persistencia asíncrona de favoritos, configuraciones y filtros.
 */
export class IStorage {
  /**
   * Obtiene un valor por clave.
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    throw new Error('IStorage.get() no implementado');
  }

  /**
   * Guarda un valor asociado a una clave.
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    throw new Error('IStorage.set() no implementado');
  }

  /**
   * Elimina una clave.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async remove(key) {
    throw new Error('IStorage.remove() no implementado');
  }

  /**
   * Lista todas las claves persistidas.
   * @returns {Promise<string[]>}
   */
  async listKeys() {
    throw new Error('IStorage.listKeys() no implementado');
  }
}
