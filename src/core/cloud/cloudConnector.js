/**
 * leptiumFrame — Conector Cloud Directo (Peer-to-Cloud / Zero-Knowledge)
 * 
 * Este módulo gestiona la sincronización directa entre el navegador del dispositivo
 * y el proveedor de nube personal (Google Photos, iCloud, OneDrive, WebDAV, JSON Feeds).
 * 
 * GARANTÍA DE PRIVACIDAD SOBERANA:
 * - Ninguna foto ni credencial pasa por servidores de leptiumFrame.
 * - Toda la configuración y los tokens se almacenan exclusivamente en el almacenamiento local del dispositivo.
 */

const STORAGE_KEY = 'leptium_cloud_config';

class CloudConnector {
  constructor() {
    this.config = this.loadConfig();
    this.cachedPhotos = [];
  }

  loadConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[CloudConnector] Error al cargar configuración local:', e);
    }
    return {
      enabled: false,
      provider: 'google',
      url: '',
      lastSync: null
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('[CloudConnector] Error al persistir configuración:', e);
    }
    return this.config;
  }

  clearConfig() {
    this.config = {
      enabled: false,
      provider: 'google',
      url: '',
      lastSync: null
    };
    this.cachedPhotos = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  getConfig() {
    return { ...this.config };
  }

  isConnected() {
    return Boolean(this.config.enabled && this.config.url);
  }

  /**
   * Sincroniza y descarga la lista de fotos desde el proveedor directo
   * @param {Object} [overrideConfig] 
   * @returns {Promise<Array<{url: string, fecha?: string, orientacion?: string, cloud: boolean}>>}
   */
  async fetchPhotos(overrideConfig = null) {
    const activeConfig = overrideConfig || this.config;
    if (!activeConfig.url) {
      throw new Error('URL de álbum o feed no especificada.');
    }

    const trimmedUrl = activeConfig.url.trim();

    try {
      let photos = [];

      switch (activeConfig.provider) {
        case 'direct': {
          photos = await this._fetchDirectFeed(trimmedUrl);
          break;
        }
        case 'webdav': {
          photos = await this._fetchWebDAV(trimmedUrl);
          break;
        }
        case 'google': {
          photos = await this._fetchGooglePhotosShared(trimmedUrl);
          break;
        }
        case 'icloud': {
          photos = await this._fetchICloudPhotosShared(trimmedUrl);
          break;
        }
        default: {
          photos = await this._fetchDirectFeed(trimmedUrl);
        }
      }

      if (photos.length > 0) {
        this.cachedPhotos = photos;
        this.saveConfig({ lastSync: Date.now(), enabled: true });
      }

      return photos;
    } catch (err) {
      console.error('[CloudConnector] Fallo de sincronización:', err);
      throw err;
    }
  }

  /**
   * Soporte para URLs directas de listas JSON o texto plano con URLs de imágenes
   */
  async _fetchDirectFeed(url) {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.photos || data.images || []);
      return list.map(item => {
        if (typeof item === 'string') {
          return { url: item, fecha: 'Nube', orientacion: 'h', cloud: true };
        }
        return {
          url: item.url || item.src,
          fecha: item.fecha || item.date || 'Nube',
          orientacion: item.orientacion || 'h',
          cloud: true
        };
      }).filter(p => Boolean(p.url));
    } else {
      const text = await res.text();
      const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('http://') || l.startsWith('https://'));

      return lines.map(lineUrl => ({
        url: lineUrl,
        fecha: 'Nube',
        orientacion: 'h',
        cloud: true
      }));
    }
  }

  /**
   * Soporte para álbumes compartidos de Google Photos
   */
  async _fetchGooglePhotosShared(url) {
    // Si el usuario pasa un enlace directo de Google Photos
    const res = await fetch(url, { mode: 'cors' }).catch(() => null);
    if (!res || !res.ok) {
      // Si CORS directo en el navegador bloquea la página web completa de Google Photos,
      // usamos proxy CORS abierto o parseamos enlaces directos
      return this._fallbackSharedImages(url, 'Google Photos');
    }

    const html = await res.text();
    // Extraer URLs de imágenes de alta resolución (lh3.googleusercontent.com)
    const matches = html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_\-]+/g);
    const urls = new Set();
    for (const match of matches) {
      const imgUrl = match[0];
      if (!imgUrl.includes('=s') && !imgUrl.includes('=w')) {
        urls.add(`${imgUrl}=w1920-h1080-no`);
      }
    }

    if (urls.size === 0) {
      return this._fallbackSharedImages(url, 'Google Photos');
    }

    return Array.from(urls).map(u => ({
      url: u,
      fecha: 'Google Photos',
      orientacion: 'h',
      cloud: true
    }));
  }

  /**
   * Soporte para transmisiones públicas de fotos de iCloud
   */
  async _fetchICloudPhotosShared(url) {
    const res = await fetch(url, { mode: 'cors' }).catch(() => null);
    if (!res || !res.ok) {
      return this._fallbackSharedImages(url, 'iCloud Photos');
    }

    const html = await res.text();
    const matches = html.matchAll(/https:\/\/[a-zA-Z0-9\.\-]+\.icloud-content\.com\/[a-zA-Z0-9_\-\/]+/g);
    const urls = new Set();
    for (const match of matches) {
      urls.add(match[0]);
    }

    if (urls.size === 0) {
      return this._fallbackSharedImages(url, 'iCloud Photos');
    }

    return Array.from(urls).map(u => ({
      url: u,
      fecha: 'iCloud Photos',
      orientacion: 'h',
      cloud: true
    }));
  }

  /**
   * Soporte para WebDAV / Nextcloud personal
   */
  async _fetchWebDAV(url) {
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Depth': '1'
      }
    }).catch(async () => {
      // Fallback a GET si PROPFIND falla
      return fetch(url);
    });

    if (!res || !res.ok) {
      return this._fallbackSharedImages(url, 'WebDAV / Nextcloud');
    }

    const text = await res.text();
    const hrefMatches = text.matchAll(/<d:href>([^<]+)<\/d:href>/gi);
    const photos = [];
    const baseUrl = new URL(url);

    for (const match of hrefMatches) {
      const path = match[1];
      if (/\.(jpe?g|png|webp|avif)$/i.test(path)) {
        const fullUrl = path.startsWith('http') ? path : `${baseUrl.origin}${path}`;
        photos.push({
          url: fullUrl,
          fecha: 'WebDAV',
          orientacion: 'h',
          cloud: true
        });
      }
    }

    return photos.length > 0 ? photos : this._fallbackSharedImages(url, 'WebDAV');
  }

  /**
   * Si la URL directa es una imagen individual o endpoint seguro
   */
  _fallbackSharedImages(url, providerName) {
    if (/\.(jpe?g|png|webp|avif)/i.test(url)) {
      return [{
        url: url,
        fecha: providerName,
        orientacion: 'h',
        cloud: true
      }];
    }
    throw new Error(`No fue posible leer fotos desde ${providerName}. Asegúrate de que el álbum sea público o que la URL permita acceso CORS.`);
  }
}

export const cloudConnector = new CloudConnector();
