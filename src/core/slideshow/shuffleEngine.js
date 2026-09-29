/**
 * Motor de reproduccion aleatoria basado en el algoritmo Fisher-Yates (Knuth) sin repeticiones.
 * Garantiza que cada fotografia visible se reproduzca exactamente una vez por ciclo completo
 * y evita que la ultima foto de un ciclo coincida con la primera del siguiente re-barajado.
 */

export function getPhotoIdentityKey(item) {
  if (!item) return '';
  if (typeof item === 'object') {
    if (item.id !== undefined && item.id !== null) {
      return `id:${item.id}`;
    }
    return String(item.ruta || item.src || item.filename || item.name || '');
  }
  return String(item);
}

/**
 * Baraja un arreglo in-place utilizando Fisher-Yates uniforme O(n).
 * Si se proporciona lastPlayedKey y hay mas de 1 elemento, evita que el primer
 * elemento del nuevo ciclo sea identico al ultimo reproducido del ciclo anterior.
 * @template T
 * @param {T[]} list
 * @param {string} [lastPlayedKey='']
 * @returns {T[]}
 */
export function fisherYatesShuffle(list, lastPlayedKey = '') {
  if (!Array.isArray(list) || list.length <= 1) {
    return list;
  }

  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }

  if (lastPlayedKey && list.length > 1) {
    const firstKey = getPhotoIdentityKey(list[0]);
    if (firstKey && firstKey === lastPlayedKey) {
      const swapIdx = 1 + Math.floor(Math.random() * (list.length - 1));
      const tmp = list[0];
      list[0] = list[swapIdx];
      list[swapIdx] = tmp;
    }
  }

  return list;
}

/**
 * Crea una copia barajada con Fisher-Yates sin mutar el arreglo original.
 * @template T
 * @param {T[]} list
 * @param {string} [lastPlayedKey='']
 * @returns {T[]}
 */
export function createShuffledDeck(list, lastPlayedKey = '') {
  if (!Array.isArray(list)) return [];
  const copy = list.slice(0);
  return fisherYatesShuffle(copy, lastPlayedKey);
}
