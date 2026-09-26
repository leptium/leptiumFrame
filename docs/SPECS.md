# Directiva de Implementación Maestra: FenixFrame Digital Canvas OS

**Destinatario:** Antigravity (Lead Coding Agent)  
**Propósito:** Implementar la infraestructura de distribución, instalación PWA offline, sistema de activación de licencias (Lemon Squeezy), motor i18n y esquema de monetización multinivel.  
**Restricción Arquitectónica Estricta:** 100% Vanilla JavaScript, HTML5 y CSS3 puro. Cero frameworks pesados, cero dependencias de servidor propio (Costo de Hosting $0.00).  
**Regla Estética No Negociable:** CERO EMOJIS en interfaces, modales, banners, mensajes y código. Todo el lenguaje visual debe regirse por **Apple SF Glassmorphism**: superficies translúcidas con `backdrop-filter: blur()`, bordes sutiles de 1px (`rgba(255, 255, 255, 0.12)`), sombras HUD de precisión, tipografía del sistema (San Francisco) y glifos vectoriales SVG limpios en lugar de caracteres decorativos o alertas nativas del navegador.

---

## 1. Estructura de Directorios del Repositorio

Organiza el proyecto estático con la siguiente jerarquía de archivos:

```text
fenixframe-app/
├── index.html                 # Lienzo digital principal y visualizador
├── landing.html               # Landing page comercial y checkout
├── manifest.webmanifest       # Identidad y configuración de PWA
├── sw.js                      # Service Worker para ejecución 100% offline
├── css/
│   ├── app.css                # Estilos del marco y overlays glassmorphic
│   └── landing.css            # Estilos comerciales y catálogo
├── js/
│   ├── app.js                 # Motor de diapositivas y reloj/widgets
│   ├── i18n.js                # Motor de internacionalización (ES / EN / FR)
│   ├── licenseManager.js      # Validación criptográfica / Lemon Squeezy
│   ├── installHelper.js       # Asistente visual de instalación iOS/Android (SF Glass)
│   └── adManager.js           # Módulo de tarjetas patrocinadas con QR (Tier Free)
├── locales/
│   ├── es.json                # Diccionario Español
│   ├── en.json                # Diccionario Inglés
│   └── fr.json                # Diccionario Francés
└── assets/
    ├── icons/
    │   ├── icon-192.png       # Icono PWA estándar
    │   ├── icon-512.png       # Icono PWA alta resolución
    │   └── apple-touch-icon.png
    └── placeholders/          # Gráficos vectoriales fallback
```

---

## 2. Módulo A: Motor PWA y Modo Autónomo 100% Offline

### A.1. `manifest.webmanifest`
Define la configuración PWA sin emojis en títulos ni descripciones:

```json
{
  "name": "FenixFrame Digital Canvas OS",
  "short_name": "FenixFrame",
  "description": "Lienzo de visualizacion fotografica privada y soberana para pantallas dedicadas",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#020408",
  "theme_color": "#020408",
  "icons": [
    {
      "src": "assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### A.2. `sw.js` (Service Worker)
Estrategia *Cache-First* estricta. Todo el frontend debe quedar depositado en el almacenamiento local del dispositivo:

```javascript
const CACHE_NAME = 'fenixframe-cache-v1';
const ASSETS_TO_PRECACHE = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/i18n.js',
  './js/licenseManager.js',
  './js/installHelper.js',
  './js/adManager.js',
  './locales/es.json',
  './locales/en.json',
  './locales/fr.json',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Omitir peticiones externas directas de activación o telemetría
  if (event.request.url.includes('api.lemonsqueezy.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        })
      );
    })
  );
});
```

---

## 3. Módulo B: Asistente de Instalación Apple Glass (`installHelper.js`)

**Estricto:** Cero emojis. Se utilizan glifos SVG minimalistas estilo SF Symbols (Share Sheet de iOS con flecha superior, símbolo más geométrico y botón de cierre en cruz delgada).

```javascript
const InstallHelper = (() => {
  let deferredPrompt = null;

  function init() {
    // Si la app ya corre en pantalla completa independiente, no desplegar avisos
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isAndroid) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showAndroidInstallBanner();
      });
    } else if (isIOS) {
      // Mostrar recordatorio tras 4 segundos de sesión activa
      setTimeout(showIOSInstallGuide, 4000);
    }
  }

  function showAndroidInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-android-banner';
    banner.className = 'sf-glass-banner';
    banner.innerHTML = `
      <div class="sf-glass-content">
        <div class="sf-icon-badge">
          <svg class="sf-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="3" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
          </svg>
        </div>
        <div class="sf-text-block">
          <span class="sf-title">Instalacion en Pantalla de Inicio</span>
          <span class="sf-sub">Ejecuta FenixFrame a pantalla completa 24/7 sin barras de navegacion</span>
        </div>
        <div class="sf-actions">
          <button id="btn-pwa-install" class="sf-btn-primary">Instalar</button>
          <button id="btn-pwa-dismiss" class="sf-btn-icon" aria-label="Cerrar">
            <svg class="sf-glyph-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('btn-pwa-install').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          banner.remove();
        }
        deferredPrompt = null;
      }
    });

    document.getElementById('btn-pwa-dismiss').addEventListener('click', () => banner.remove());
  }

  function showIOSInstallGuide() {
    const iosBanner = document.createElement('div');
    iosBanner.id = 'pwa-ios-guide';
    iosBanner.className = 'sf-glass-modal-backdrop';
    iosBanner.innerHTML = `
      <div class="sf-glass-card sf-glass-card-ios">
        <div class="sf-card-header">
          <div class="sf-indicator-dot"></div>
          <span class="sf-card-headline">CONFIGURACION DE PANTALLA COMPLETA</span>
        </div>
        <div class="sf-step-row">
          <div class="sf-step-num">01</div>
          <div class="sf-step-body">
            <span>Pulsa el boton <strong>Compartir</strong> en la barra de Safari.</span>
            <div class="sf-glyph-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="sf-step-row">
          <div class="sf-step-num">02</div>
          <div class="sf-step-body">
            <span>Selecciona <strong>"Añadir a pantalla de inicio"</strong>.</span>
            <div class="sf-glyph-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
          </div>
        </div>
        <button id="btn-ios-ack" class="sf-btn-block">Entendido</button>
      </div>
    `;
    document.body.appendChild(iosBanner);
    document.getElementById('btn-ios-ack').addEventListener('click', () => iosBanner.remove());
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', InstallHelper.init);
```

---

## 4. Módulo C: Gestión de Licencias y Notificaciones HUD Glass (`licenseManager.js`)

**Estricto:** Cero llamadas a `alert()` de navegador. Toda confirmación o advertencia se presenta mediante un elemento HUD flotante con desenfoque de cristal.

```javascript
const LicenseManager = (() => {
  const STORAGE_KEY = 'fenixframe_license_data';

  const TIERS = {
    FREE: 'free',
    BASIC: 'basic',     // Hasta 1,000 fotos, sin banners
    PRO: 'pro',         // Fotos ilimitadas, sin banners, widgets avanzados
    MAKER: 'maker'      // Código fuente completo / self-hosted
  };

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const incomingKey = params.get('license_key');

    if (incomingKey) {
      await activateKey(incomingKey);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function activateKey(key) {
    try {
      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          license_key: key,
          instance_name: `FenixFrame-${navigator.userAgent.slice(0, 30)}`
        })
      });

      const data = await response.json();

      if (data.activated) {
        const productName = (data.meta && data.meta.product_name) ? data.meta.product_name.toLowerCase() : '';
        let detectedTier = TIERS.BASIC;

        if (productName.includes('pro') || productName.includes('unlimited')) {
          detectedTier = TIERS.PRO;
        } else if (productName.includes('maker')) {
          detectedTier = TIERS.MAKER;
        }

        const payload = {
          key: key,
          tier: detectedTier,
          activatedAt: Date.now(),
          customerEmail: data.meta?.customer_email || ''
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        showHudToast(`Licencia ${detectedTier.toUpperCase()} activada con exito`, 'success');
        setTimeout(() => window.location.reload(), 1800);
      } else {
        showHudToast('Clave de licencia invalida o activaciones agotadas', 'error');
      }
    } catch (err) {
      console.warn('Verificacion remota no disponible. Estado en cache mantenido:', err);
    }
  }

  function showHudToast(message, type = 'info') {
    const existing = document.getElementById('sf-hud-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'sf-hud-toast';
    toast.className = `sf-hud-toast sf-hud-${type}`;
    const iconColor = type === 'success' ? '#22c55e' : (type === 'error' ? '#ef4444' : '#38bdf8');

    toast.innerHTML = `
      <div class="sf-hud-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${type === 'success' ? '<polyline points="20 6 9 17 4 12" />' : '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />'}
        </svg>
      </div>
      <span class="sf-hud-label">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('sf-hud-exit');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  function getCurrentTier() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return TIERS.FREE;
    try {
      return JSON.parse(raw).tier || TIERS.FREE;
    } catch {
      return TIERS.FREE;
    }
  }

  function getMaxPhotoLimit() {
    const tier = getCurrentTier();
    return (tier === TIERS.FREE || tier === TIERS.BASIC) ? 1000 : Infinity;
  }

  function isAdSupported() {
    return getCurrentTier() === TIERS.FREE;
  }

  return {
    init,
    activateKey,
    getCurrentTier,
    getMaxPhotoLimit,
    isAdSupported,
    showHudToast,
    TIERS
  };
})();

window.addEventListener('DOMContentLoaded', LicenseManager.init);
```

---

## 5. Módulo D: Motor de Internacionalización (`i18n.js`)

Gestión de textos en ES, EN y FR. Sin caracteres de emojis en ningún archivo de traducción:

```javascript
const I18nEngine = (() => {
  const SUPPORTED_LANGS = ['es', 'en', 'fr'];
  const DEFAULT_LANG = 'es';
  let currentLang = DEFAULT_LANG;
  let translations = {};

  async function init() {
    const saved = localStorage.getItem('fenixframe_lang');
    const browserLang = navigator.language.slice(0, 2).toLowerCase();

    if (saved && SUPPORTED_LANGS.includes(saved)) {
      currentLang = saved;
    } else if (SUPPORTED_LANGS.includes(browserLang)) {
      currentLang = browserLang;
    }

    await loadTranslations(currentLang);
    applyDOMTranslations();
  }

  async function loadTranslations(lang) {
    try {
      const res = await fetch(`./locales/${lang}.json`);
      translations = await res.json();
      currentLang = lang;
      localStorage.setItem('fenixframe_lang', lang);
    } catch (err) {
      console.error(`Error cargando archivo de idioma: ${lang}`, err);
    }
  }

  function t(key, fallback = '') {
    return key.split('.').reduce((obj, k) => (obj || {})[k], translations) || fallback || key;
  }

  function applyDOMTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });
  }

  async function setLanguage(lang) {
    if (SUPPORTED_LANGS.includes(lang)) {
      await loadTranslations(lang);
      applyDOMTranslations();
    }
  }

  return { init, t, setLanguage, getCurrentLang: () => currentLang };
})();

window.addEventListener('DOMContentLoaded', I18nEngine.init);
```

### Ejemplo de Diccionario Limpio (`locales/es.json`):
```json
{
  "brand": {
    "title": "FenixFrame",
    "subtitle": "Lienzo fotografico digital soberano"
  },
  "settings": {
    "license": "Licencia",
    "activate": "Activar Licencia",
    "placeholder_key": "Introduce tu clave de licencia",
    "language": "Idioma",
    "storage_used": "Elementos en memoria local"
  },
  "ads": {
    "sponsored": "SELECCION RECOMENDADA",
    "scan_to_buy": "Escanea con la camara de tu telefono para ver especificaciones"
  }
}
```

---

## 6. Módulo E: Tarjetas Patrocinadas Glassmorphic con QR (`adManager.js`)

**Estricto:** Cero emojis. Diseñado como una tarjeta flotante de cristal satinado oscuro con indicador luminoso sutil y barra de progreso de tiempo Apple SF.

```javascript
const AdManager = (() => {
  const SPONSORED_PRODUCTS = [
    {
      title: "Soporte de Aluminio Anodizado para Pantalla",
      price: "$19.99",
      store: "Amazon Oficial",
      url: "https://amazon.com/dp/B00EXAMPLE?tag=tuidafiliado-20",
      qrDataUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="
    },
    {
      title: "Cargador Magnetico Continuo 24/7",
      price: "$24.99",
      store: "Amazon Oficial",
      url: "https://amazon.com/dp/B01EXAMPLE?tag=tuidafiliado-20",
      qrDataUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="
    }
  ];

  let slideCounter = 0;
  const AD_FREQUENCY = 15; // Un producto cada 15 transiciones

  function checkAndRenderAd(containerElement, onResume) {
    if (!LicenseManager.isAdSupported()) {
      return false;
    }

    slideCounter++;
    if (slideCounter % AD_FREQUENCY !== 0) {
      return false;
    }

    const product = SPONSORED_PRODUCTS[Math.floor(Math.random() * SPONSORED_PRODUCTS.length)];
    const fullQrUrl = `${product.qrDataUrl}${encodeURIComponent(product.url)}`;

    const adOverlay = document.createElement('div');
    adOverlay.className = 'sf-ad-overlay-wrapper';
    adOverlay.innerHTML = `
      <div class="sf-ad-glass-panel">
        <div class="sf-ad-top-pill">
          <span class="sf-dot-pulse"></span>
          <span class="sf-ad-badge-txt">${I18nEngine.t('ads.sponsored', 'SELECCION RECOMENDADA')}</span>
        </div>
        <h3 class="sf-ad-title">${product.title}</h3>
        <p class="sf-ad-meta">${product.price} &bull; ${product.store}</p>
        <div class="sf-ad-qr-container">
          <img src="${fullQrUrl}" alt="QR" class="sf-ad-qr-code" />
        </div>
        <p class="sf-ad-cta-label">${I18nEngine.t('ads.scan_to_buy', 'Escanea para acceder a la tienda')}</p>
        <div class="sf-ad-countdown-track">
          <div class="sf-ad-countdown-fill"></div>
        </div>
      </div>
    `;

    containerElement.appendChild(adOverlay);

    setTimeout(() => {
      adOverlay.classList.add('sf-fade-out');
      setTimeout(() => {
        adOverlay.remove();
        if (onResume) onResume();
      }, 300);
    }, 10000);

    return true;
  }

  return { checkAndRenderAd };
})();
```

---

## 7. Hoja de Estilos Apple SF Glassmorphism (`css/app.css` - Extracto Base)

Antigravity debe aplicar estas propiedades para garantizar el acabado visual de vidrio satinado y tipografía nativa:

```css
/* Tipografía base Apple System */
body, input, button {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Superficie de cristal satinado universal */
.sf-glass-card,
.sf-glass-banner,
.sf-ad-glass-panel,
.sf-hud-toast {
  background: rgba(9, 13, 22, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

/* Botón primario de cristal / acento */
.sf-btn-primary, .sf-btn-block {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  font-weight: 600;
  font-size: 13px;
  border-radius: 980px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sf-btn-primary:hover, .sf-btn-block:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: #38bdf8;
}

/* Indicador HUD Toast flotante */
.sf-hud-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.2px;
  animation: sfHudEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes sfHudEnter {
  from { opacity: 0; transform: translate(-50%, -10px) scale(0.96); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
}

.sf-hud-exit {
  opacity: 0;
  transform: translate(-50%, -10px) scale(0.96);
  transition: all 0.3s ease;
}
```

---

## 8. Verificación de Antigravity antes de entrega

1. **Revisión de caracteres:** Comprobar que en ningún `.html`, `.js`, ni `.json` exista un solo emoji.
2. **Inspección de Glifos:** Validar que todos los botones de acción utilicen paths SVG limpios con trazo Apple SF (`stroke-width="1.8"`).
3. **Comportamiento Offline:** Desconectar red y validar que tanto el visor como los paneles glassmorphic carguen instantáneamente desde el Service Worker.