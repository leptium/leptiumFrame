import { Storage } from '../../hal/index.js';

/**
 * Gestor de estado reactivo y persistencia desacoplada para leptiumFrame.
 */
export class FrameStore {
  constructor() {
    this.state = {
      hiddenPhotos: {},
      favoritas: [],
      autoDim: true,
      galleryFrame: false,
      fillScreen: true,
      selectedYear: 'all',
      isPaused: false,
      modoFavoritas: false,
      currentIndex: 0
    };
    this.listeners = new Set();
  }

  async init() {
    try {
      const [hidden, favs, dim, frame, fill] = await Promise.all([
        Storage.get('hiddenPhotos'),
        Storage.get('leptium_favoritas'),
        Storage.get('autoDim'),
        Storage.get('galleryFrame'),
        Storage.get('fillScreen')
      ]);

      if (hidden && typeof hidden === 'object') {
        this.state.hiddenPhotos = { ...hidden };
      }
      if (typeof localStorage !== 'undefined') {
        const rawHiddenIds = localStorage.getItem('leptium_hidden_ids');
        if (rawHiddenIds !== null) {
          try {
            const parsed = JSON.parse(rawHiddenIds);
            if (Array.isArray(parsed)) {
              parsed.forEach((id) => {
                if (id) this.state.hiddenPhotos[id] = true;
              });
            } else if (parsed && typeof parsed === 'object') {
              Object.assign(this.state.hiddenPhotos, parsed);
            }
          } catch (_) {}
        }
      }
      if (Array.isArray(favs)) this.state.favoritas = favs;
      if (dim !== null && dim !== undefined) this.state.autoDim = Boolean(dim);
      if (frame !== null && frame !== undefined) this.state.galleryFrame = Boolean(frame);
      if (fill !== null && fill !== undefined) this.state.fillScreen = Boolean(fill);

      this._notify();
    } catch (err) {
      console.warn('[FrameStore] Error inicializando estado desde storage:', err);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this.listeners.forEach((cb) => cb(this.state));
  }

  getState() {
    return { ...this.state };
  }

  async toggleFavorita(photoPath) {
    const idx = this.state.favoritas.indexOf(photoPath);
    if (idx === -1) {
      this.state.favoritas.push(photoPath);
    } else {
      this.state.favoritas.splice(idx, 1);
    }
    await Storage.set('leptium_favoritas', this.state.favoritas);
    this._notify();
    return idx === -1; // true si ahora es favorita
  }

  isFavorita(photoPath) {
    return this.state.favoritas.includes(photoPath);
  }

  async hidePhoto(photoPath) {
    this.state.hiddenPhotos[photoPath] = true;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('leptium_hidden_ids', JSON.stringify(Object.keys(this.state.hiddenPhotos)));
      } catch (_) {}
    }
    await Storage.set('hiddenPhotos', this.state.hiddenPhotos);
    this._notify();
  }

  async resetHiddenPhotos() {
    this.state.hiddenPhotos = {};
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('leptium_hidden_ids');
      } catch (_) {}
    }
    await Storage.remove('hiddenPhotos');
    this._notify();
  }

  async setAutoDim(enabled) {
    this.state.autoDim = enabled;
    await Storage.set('autoDim', enabled);
    this._notify();
  }

  async setGalleryFrame(enabled) {
    this.state.galleryFrame = enabled;
    await Storage.set('galleryFrame', enabled);
    this._notify();
  }

  async setFillScreen(enabled) {
    this.state.fillScreen = enabled;
    await Storage.set('fillScreen', enabled);
    this._notify();
  }

  setSelectedYear(year) {
    this.state.selectedYear = year;
    this._notify();
  }

  setPaused(paused) {
    this.state.isPaused = paused;
    this._notify();
  }

  setModoFavoritas(enabled) {
    this.state.modoFavoritas = enabled;
    this._notify();
  }

  setCurrentIndex(index) {
    this.state.currentIndex = index;
    this._notify();
  }
}

export const store = new FrameStore();
