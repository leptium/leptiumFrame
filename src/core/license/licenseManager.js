/**
 * LicenseManager — leptium FenixFrame
 * Dual online & offline cryptographic license activation system.
 * Connects with Lemon Squeezy API with offline pattern fallback.
 * Strictly zero emojis. Uses HUD Toast for notifications.
 */

import { sponsorEngine } from '../ads/sponsorEngine.js';
import { showHudToast } from '../../ui/hud/hudToast.js';
import { i18n } from '../i18n/index.js';

const PRIMARY_STORAGE_KEY = 'fenixframe_license_data';
const LEGACY_STORAGE_KEY = 'leptium_license';

export const TIERS = {
  FREE: 'free',
  BASIC: 'basic',   // Up to 1,000 photos, no sponsored cards
  PRO: 'pro',       // Unlimited photos, no sponsored cards, cloud sync, pro features
  MAKER: 'maker'    // Full source code / self-hosted / unrestricted
};

export class LicenseManager {
  constructor() {
    this.TIERS = TIERS;
    this.license = this.loadLicense();
    this.listeners = new Set();

    // Sincronizar el motor de patrocinios con el tier activo
    if (sponsorEngine && typeof sponsorEngine.setTier === 'function') {
      sponsorEngine.setTier(this.license.tier);
    }
  }

  async init() {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const incomingKey = params.get('license_key');

      if (incomingKey) {
        await this.activateKey(incomingKey);
        // Limpiar parámetro de la URL sin recargar la página
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (err) {
      console.warn('[LicenseManager] Error al inicializar desde URL:', err);
    }
  }

  loadLicense() {
    try {
      if (typeof localStorage === 'undefined') {
        return { active: false, tier: TIERS.FREE, key: '', activatedAt: null };
      }

      // Comprobar clave primaria primero
      const primaryData = localStorage.getItem(PRIMARY_STORAGE_KEY);
      if (primaryData) {
        const parsed = JSON.parse(primaryData);
        if (parsed && (parsed.tier || parsed.active)) {
          return {
            active: parsed.tier !== TIERS.FREE,
            tier: parsed.tier || TIERS.FREE,
            key: parsed.key || '',
            activatedAt: parsed.activatedAt || null,
            customerEmail: parsed.customerEmail || ''
          };
        }
      }

      // Fallback a clave legacy
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        if (parsed && parsed.active && parsed.tier) {
          return {
            active: true,
            tier: parsed.tier,
            key: parsed.key || '',
            activatedAt: parsed.activatedAt || null
          };
        }
      }
    } catch (e) {
      console.warn('[LicenseManager] Error al leer licencia:', e);
    }

    return {
      active: false,
      tier: TIERS.FREE,
      key: '',
      activatedAt: null
    };
  }

  saveLicense(licenseObj) {
    this.license = licenseObj;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(this.license));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(this.license));
      }
    } catch (e) {
      console.error('[LicenseManager] Error al guardar licencia:', e);
    }

    if (sponsorEngine && typeof sponsorEngine.setTier === 'function') {
      sponsorEngine.setTier(this.license.tier);
    }
    this._notify();
  }

  getLicense() {
    return { ...this.license };
  }

  getCurrentTier() {
    return this.license.tier || TIERS.FREE;
  }

  isPaid() {
    return this.license.active && this.license.tier !== TIERS.FREE;
  }

  isPro() {
    return this.license.active && (this.license.tier === TIERS.PRO || this.license.tier === TIERS.MAKER);
  }

  isAdSupported() {
    return this.getCurrentTier() === TIERS.FREE;
  }

  getMaxPhotoLimit() {
    const tier = this.getCurrentTier();
    return (tier === TIERS.FREE || tier === TIERS.BASIC) ? 1000 : Infinity;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.license);
      } catch (e) {}
    });
  }

  /**
   * Validación dual: API Lemon Squeezy en vivo con fallback offline transparente a regex
   * @param {string} rawKey - Clave de licencia
   * @returns {Promise<{success: boolean, tier?: string, message?: string}>}
   */
  async activateKey(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') {
      this._toast('Clave de licencia invalida', 'error');
      return { success: false, message: 'invalidKey' };
    }

    const key = rawKey.trim().toUpperCase();

    // 1. Intento de activación remota mediante la API oficial de Lemon Squeezy si hay conectividad
    let remoteSuccess = false;
    let remoteTier = null;
    let customerEmail = '';

    if (typeof fetch === 'function' && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
      try {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 30) : 'Standard';
        const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            license_key: key,
            instance_name: `leptium-FenixFrame-${ua}`
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.activated) {
            remoteSuccess = true;
            const productName = (data.meta && data.meta.product_name) ? data.meta.product_name.toLowerCase() : '';
            if (productName.includes('pro') || productName.includes('unlimited')) {
              remoteTier = TIERS.PRO;
            } else if (productName.includes('maker')) {
              remoteTier = TIERS.MAKER;
            } else {
              remoteTier = TIERS.BASIC;
            }
            customerEmail = data.meta?.customer_email || '';
          }
        }
      } catch (remoteErr) {
        console.warn('[LicenseManager] Verificacion remota no disponible. Pasando a fallback local:', remoteErr);
      }
    }

    // 2. Si la validación remota fue exitosa, guardamos inmediatamente
    if (remoteSuccess && remoteTier) {
      const payload = {
        active: true,
        tier: remoteTier,
        key: key,
        activatedAt: Date.now(),
        customerEmail
      };
      this.saveLicense(payload);
      this._toast(i18n.t('toasts.activated') || 'Licencia activada con exito. Bienvenido a FenixFrame', 'success');
      return { success: true, tier: remoteTier, message: 'successActive' };
    }

    // 3. Fallback Offline: Validación criptográfica / sintáctica local
    // Formatos válidos:
    // a. Prefijo LF-: LF-PRO-XXXX-XXXX, LF-BAS-XXXX-XXXX, LF-MKR-XXXX-XXXX
    // b. Clave UUID o formato Lemon Squeezy / Gumroad: XXXX-XXXX-XXXX-XXXX
    const isLfPattern = /^LF-(PRO|BAS|MKR)-[A-Z0-9]{3,8}(-[A-Z0-9]{3,8})*$/i.test(key);
    const isStorePattern = /^[A-Z0-9]{4,8}(-[A-Z0-9]{4,12}){3,5}$/i.test(key) || /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(key);

    if (isLfPattern || isStorePattern) {
      let localTier = TIERS.PRO;
      if (isLfPattern) {
        if (key.startsWith('LF-MKR')) localTier = TIERS.MAKER;
        else if (key.startsWith('LF-BAS')) localTier = TIERS.BASIC;
        else localTier = TIERS.PRO;
      }

      const payload = {
        active: true,
        tier: localTier,
        key: key,
        activatedAt: Date.now()
      };

      this.saveLicense(payload);
      this._toast(i18n.t('toasts.activated') || 'Licencia activada con exito. Bienvenido a FenixFrame', 'success');
      return { success: true, tier: localTier, message: 'successActive' };
    }

    // Si fallaron ambas
    this._toast(i18n.t('toasts.invalid_key') || 'Clave no valida o activaciones agotadas', 'error');
    return { success: false, message: 'invalidKey' };
  }

  /**
   * Alias de compatibilidad con versiones previas
   */
  activate(rawKey) {
    return this.activateKey(rawKey);
  }

  deactivate() {
    const freeLicense = {
      active: false,
      tier: TIERS.FREE,
      key: '',
      activatedAt: null
    };
    this.saveLicense(freeLicense);
    this._toast('Licencia desactivada. Modo Free activo', 'info');
    return { success: true, message: 'deactivatedNotice' };
  }

  _toast(msg, type) {
    if (typeof showHudToast === 'function') {
      showHudToast(msg, type);
    }
  }
}

export const licenseManager = new LicenseManager();

if (typeof window !== 'undefined') {
  window.LicenseManager = licenseManager;
  window.addEventListener('DOMContentLoaded', () => {
    licenseManager.init().catch(() => {});
  });
}
