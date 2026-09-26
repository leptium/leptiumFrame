import { es } from './locales/es.js';
import { en } from './locales/en.js';
import { fr } from './locales/fr.js';

const STORAGE_KEY = 'leptium_language';
const SUPPORTED_LANGS = ['es', 'en', 'fr'];
const TRANSLATIONS = { es, en, fr };

export class I18nEngine {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.listeners = new Set();
  }

  detectLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) {
        return saved;
      }
    } catch (e) {
      // Manejo de restricciones de almacenamiento privado
    }

    const browserLang = (typeof navigator !== 'undefined' && navigator.language)
      ? navigator.language.split('-')[0].toLowerCase()
      : 'es';

    return SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'es';
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    this.currentLang = lang;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Ignorar
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      this.translateDOM();
    }

    this.listeners.forEach(callback => {
      try {
        callback(lang);
      } catch (err) {
        console.error('Error en listener de i18n:', err);
      }
    });
  }

  t(path, params = {}) {
    if (!path) return '';
    const keys = path.split('.');
    let value = TRANSLATIONS[this.currentLang];

    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Fallback a inglés si falta en el idioma actual
        let fallback = TRANSLATIONS.en;
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            fallback = null;
            break;
          }
        }
        value = fallback !== null ? fallback : path;
        break;
      }
    }

    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
    }

    return value;
  }

  translateDOM(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    // Traducir contenido de texto o HTML interno
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = this.t(key);
        if (typeof translated === 'string') {
          el.innerHTML = translated;
        }
      }
    });

    // Traducir atributos (ej: data-i18n-attr="placeholder:hero.input,title:nav.tooltip")
    const attrElements = root.querySelectorAll('[data-i18n-attr]');
    attrElements.forEach(el => {
      const config = el.getAttribute('data-i18n-attr');
      if (config) {
        config.split(',').forEach(pair => {
          const [attr, key] = pair.split(':');
          if (attr && key) {
            el.setAttribute(attr.trim(), this.t(key.trim()));
          }
        });
      }
    });

    // Actualizar botones activos del selector de idioma si existen
    const langBtns = root.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  onLanguageChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const i18n = new I18nEngine();
