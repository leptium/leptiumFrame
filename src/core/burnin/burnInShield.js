/**
 * Motor de prevención de quemado de pantalla (Pixel-Shifting)
 * Desplaza imperceptiblemente (1-2px) los elementos estáticos cada 15 minutos
 * para proteger paneles OLED, AMOLED y pantallas IPS en funcionamiento 24/7.
 */
export class BurnInShield {
  /**
   * @param {Object} options
   * @param {number} [options.intervalMs=900000] - 15 minutos por defecto
   * @param {number} [options.maxShiftPx=2] - Máximo desplazamiento en píxeles
   */
  constructor(options = {}) {
    this.intervalMs = options.intervalMs || 15 * 60 * 1000;
    this.maxShiftPx = options.maxShiftPx || 2;
    this.timer = null;
    this.elements = new Set();
  }

  /**
   * Registra uno o más elementos DOM para aplicar pixel-shifting.
   * @param {HTMLElement|string|HTMLElement[]} target
   */
  register(target) {
    if (typeof target === 'string') {
      document.querySelectorAll(target).forEach(el => this.elements.add(el));
    } else if (Array.isArray(target)) {
      target.forEach(el => el && this.elements.add(el));
    } else if (target instanceof HTMLElement) {
      this.elements.add(target);
    }
  }

  /**
   * Inicia el ciclo de pixel-shifting.
   */
  start() {
    if (this.timer) return;
    this.shift();
    this.timer = setInterval(() => this.shift(), this.intervalMs);
  }

  /**
   * Aplica un micro-desplazamiento aleatorio dentro del rango permitido.
   */
  shift() {
    // Valores enteros entre -maxShiftPx y +maxShiftPx
    const dx = Math.floor(Math.random() * (this.maxShiftPx * 2 + 1)) - this.maxShiftPx;
    const dy = Math.floor(Math.random() * (this.maxShiftPx * 2 + 1)) - this.maxShiftPx;

    this.elements.forEach(el => {
      if (el && el.style) {
        el.style.transition = 'transform 1.5s ease-in-out';
        if (el.id === 'actionToolbar') {
          el.style.transform = `translate3d(calc(-50% + ${dx}px), ${dy}px, 0)`;
        } else {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      }
    });
  }

  /**
   * Detiene el protector y restaura la posición original.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elements.forEach(el => {
      if (el && el.style) {
        el.style.transform = '';
      }
    });
  }
}
