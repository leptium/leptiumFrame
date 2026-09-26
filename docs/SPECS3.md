# Directiva de Implementación Maestra: FenixFrame Digital Canvas OS (v2.0 Consolidada)

**Destinatario:** Antigravity (Lead Coding Agent)  
**Propósito:** Especificación unificada de arquitectura, desacoplamiento de rutas (Landing vs. App), experiencia de usuario sin fricción, almacenamiento local en IndexedDB, motor PWA offline, sistema i18n, monetización por niveles (Lemon Squeezy + Afiliados) y garantía de deuda técnica cero.

**Restricciones Arquitectónicas Innegociables:**
1. **100% Vanilla:** HTML5, CSS3 puro y JavaScript moderno nativo. Cero frameworks (ni React, ni Vue, ni Tailwind compilado), cero dependencias de servidores propietarios (Costo de infraestructura: $0.00 en Cloudflare Pages / GitHub Pages).
2. **Cero Dependencias Externas de Red:** Queda terminantemente prohibido llamar a Google Fonts, FontAwesome o CDNs de iconos. Toda la tipografía se resuelve mediante fuentes del sistema Apple (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`) y todos los glifos deben ser vectores `<svg>` limpios e inline con trazo `stroke-width="1.8"`.
3. **CERO EMOJIS:** Prohibido el uso de caracteres emoji en interfaces, modales, alertas, notificaciones, código fuente o diccionarios JSON.
4. **Apple SF Glassmorphism:** Superficies oscuras translúcidas (`backdrop-filter: blur(24px) saturate(180%)`), bordes de precisión milimétrica (`1px solid rgba(255, 255, 255, 0.12)`), sombras HUD profundas y alertas flotantes no bloqueantes (cero llamadas a `alert()` nativo).
5. **Identidad PWA:** El `short_name` en el manifiesto PWA debe ser obligatoriamente **"FenixFoto"** para que ocupe el mínimo espacio sin cortarse al instalarse en la pantalla de inicio del iPad/Android.

---

## 1. Topología del Proyecto y Desacoplamiento de Rutas

Para eliminar la fricción detectada y erradicar cualquier bloqueo invasivo, la web comercial y el visor digital deben estar estrictamente separados:

```
fenixframe-app/
├── index.html                 # LANDING PAGE: 100% comercial, informativa y ligera. CERO PWA scripts.
├── app.html                   # DIGITAL CANVAS: El lienzo reproductor, PWA real, widgets y settings.
├── manifest.webmanifest       # Identidad PWA vinculada exclusivamente a app.html (short_name: "FenixFoto")
├── sw.js                      # Service Worker para ejecución 100% offline (Cache-First)
├── css/
│   ├── landing.css            # Estilos de presentación comercial
│   └── app.css                # Estilos de lienzo, HUD glassmorphic y modales
├── js/
│   ├── app.js                 # Ciclo de vida del marco, diapositivas y Wake Lock
│   ├── db.js                  # Capa de abstracción IndexedDB (gestión de gigabytes locales)
│   ├── i18n.js                # Motor de internacionalización (ES / EN / FR)
│   ├── licenseManager.js      # Validación de licencias Lemon Squeezy y tiers
│   ├── installHelper.js       # Asistente PWA NO INVASIVO (exclusivo para app.html)
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
    └── demo/                  # 3 a 5 fotos de demostración locales (WebP ligero)
        ├── sample-1.webp
        ├── sample-2.webp
        └── sample-3.webp
```

---

## 2. Reglas de Desacoplamiento UX (Landing vs. Canvas)

### A. Landing Page (`index.html`)
* **Propósito:** Informar, presentar los planes y convertir ventas.
* **Prohibición:** No debe cargar `installHelper.js`, no debe registrar el Service Worker de forma agresiva y jamás debe mostrar modales de instalación en pantalla completa.
* **Llamados a la Acción (CTAs):**
  * Botón Primario: Checkout de Lemon Squeezy según el plan elegido.
  * Botón Secundario: *«Abrir Lienzo en Navegador»* (enlace directo a `app.html`).

### B. Aplicación / Lienzo (`app.html`)
* **Propósito:** Reproducir fotografías sin interrupciones 24/7.
* **PWA Bajo Demanda (No Invasiva):** En lugar de un temporizador de 30 segundos que bloquee la pantalla, la opción de instalar se presenta como un icono SVG discreto en el panel flotante o un botón sutil: *«Modo Pantalla Completa / Instalar»*. Solo cuando el usuario hace clic deliberadamente, se despliega la guía paso a paso de iOS/Android.
* **Flujo Post-Compra Automático:** Lemon Squeezy redirige al usuario a:
  `https://tudominio.com/app.html?license_key=[license_key]`
  El script `licenseManager.js` detecta el parámetro en milisegundos, valida la clave, la almacena localmente, limpia la URL con `window.history.replaceState` y despliega un HUD Toast elegante: *«Licencia Activada. Bienvenido a FenixFrame»*.

---

## 3. Arquitectura para Deuda Técnica Cero

### A. Almacenamiento Robusto: `IndexedDB` (`js/db.js`)
* **Regla Crítica:** Queda estrictamente prohibido guardar fotos de usuarios en `localStorage` (debido al límite infranqueable de 5 MB del navegador).
* `localStorage` se reserva únicamente para flags livianos: clave de licencia, tier activo, idioma seleccionado y tiempo de transición.
* Todas las fotos del usuario (objetos `Blob` o `File`) se almacenan en una base de datos local `IndexedDB` (`FenixFrameDB`, objectStore: `photos`). Esto permite almacenar miles de imágenes de alta resolución sin degradar el rendimiento.

```javascript
// js/db.js - Módulo de persistencia local de alto rendimiento
const FenixDB = (() => {
  const DB_NAME = 'FenixFrameDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'photos';
  let db = null;

  async function open() {
    if (db) return db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function addPhoto(blob, filename) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = { blob, filename, addedAt: Date.now() };
      const req = store.add(entry);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAllPhotos() {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getPhotoCount() {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function clearAll() {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  return { addPhoto, getAllPhotos, getPhotoCount, clearAll };
})();
```

### B. Mantener Pantalla Encendida: Screen Wake Lock API
Para evitar que tablets y teléfonos apaguen la pantalla a los 2 minutos de inactividad, `app.js` debe solicitar el bloqueo de suspensión:

```javascript
let wakeLock = null;

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch (err) {
      console.warn('Wake Lock no disponible:', err);
    }
  }
}

// Reactivar el bloqueo si el usuario cambia de pestaña y regresa
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    requestWakeLock();
  }
});
```

### C. Estado Inicial Elegante (First-Run Empty State)
Si la base de datos `IndexedDB` está vacía, el lienzo no debe mostrar una pantalla negra ni errores. Debe cargar inmediatamente un carrusel con las 3 imágenes de muestra situadas en `assets/demo/`, acompañadas de un botón flotante de cristal que invite a cargar fotografías personales.

---

## 4. Matriz de Niveles y Monetización

| Característica | Plan Gratuito (Ad-Supported) | Plan Básico ($4.99) | Plan Pro ($9.99) | Plan Maker ($39.00) |
| :--- | :--- | :--- | :--- | :--- |
| **Publicidad / Afiliados** | Tarjetas con QR cada 15 fotos | CERO anuncios | CERO anuncios | CERO anuncios |
| **Capacidad de Fotos** | Hasta 500 fotos | Hasta 500 fotos | Ilimitadas | Ilimitadas |
| **Dispositivos** | 1 dispositivo | 1 dispositivo | Hasta 5 dispositivos | Dispositivos ilimitados |
| **Widgets y Extras** | Reloj analógico/digital | Reloj + Fecha | Reloj + Clima en vivo + Micro-shift OLED | Código fuente completo + Guía Kiosk Pi |
| **Entrega** | Libre acceso web | Clave de licencia Lemon Squeezy | Clave de licencia Lemon Squeezy | Archivo ZIP en Lemon Squeezy |

---

## 5. Módulo de Tarjetas Patrocinadas con Código QR (`js/adManager.js`)

En el plan gratuito, el sistema debe intercalar una tarjeta glassmorphic satinada con un código QR escaneable hacia tiendas verificadas (Amazon Associates, Apple Store Affiliate, etc.) cada 15 transiciones de fotos, con una duración de 10 segundos y temporizador visual:

```javascript
const AdManager = (() => {
  const SPONSORED_CATALOG = [
    {
      title: "Soporte de Aluminio Anodizado para Tablet",
      price: "$19.99",
      store: "Amazon Prime",
      url: "https://amazon.com/dp/B00EXAMPLE?tag=tuidafiliado-20",
      qrBase: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="
    },
    {
      title: "Cable Magnetico Angulado 90 Grados 24/7",
      price: "$14.99",
      store: "Amazon Prime",
      url: "https://amazon.com/dp/B01EXAMPLE?tag=tuidafiliado-20",
      qrBase: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="
    }
  ];

  let counter = 0;
  const FREQUENCY = 15;

  function shouldDisplayAd() {
    if (!LicenseManager.isAdSupported()) return false;
    counter++;
    return counter % FREQUENCY === 0;
  }

  function renderAd(container, onComplete) {
    const item = SPONSORED_CATALOG[Math.floor(Math.random() * SPONSORED_CATALOG.length)];
    const qrSrc = `${item.qrBase}${encodeURIComponent(item.url)}`;

    const overlay = document.createElement('div');
    overlay.className = 'sf-ad-overlay';
    overlay.innerHTML = `
      <div class="sf-ad-card">
        <div class="sf-ad-header">
          <span class="sf-ad-pill-badge">${I18nEngine.t('ads.badge')}</span>
          <span class="sf-ad-store">${item.store}</span>
        </div>
        <h3 class="sf-ad-product-name">${item.title}</h3>
        <p class="sf-ad-price">${item.price}</p>
        <div class="sf-ad-qr-box">
          <img src="${qrSrc}" alt="QR Compra" class="sf-ad-qr-image" />
        </div>
        <p class="sf-ad-instruction">${I18nEngine.t('ads.scan_instruction')}</p>
        <div class="sf-progress-track">
          <div class="sf-progress-bar"></div>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('sf-ad-exit');
      setTimeout(() => {
        overlay.remove();
        if (onComplete) onComplete();
      }, 400);
    }, 10000);
  }

  return { shouldDisplayAd, renderAd };
})();
```

---

## 6. Motor de Internacionalización (`js/i18n.js`)

Soporte completo para Español, Inglés y Francés. Sin emojis en ninguna traducción:

```javascript
const I18nEngine = (() => {
  const LOCALES = ['es', 'en', 'fr'];
  const STORAGE_KEY = 'fenixframe_lang';
  let currentLocale = 'es';
  let dictionary = {};

  async function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const navLang = (navigator.language || 'es').slice(0, 2).toLowerCase();

    if (saved && LOCALES.includes(saved)) {
      currentLocale = saved;
    } else if (LOCALES.includes(navLang)) {
      currentLocale = navLang;
    }

    await loadDictionary(currentLocale);
    translateDOM();
  }

  async function loadDictionary(lang) {
    try {
      const response = await fetch(`./locales/${lang}.json`);
      dictionary = await response.json();
      currentLocale = lang;
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Fallo al cargar diccionario i18n:', e);
    }
  }

  function t(path, fallback = '') {
    return path.split('.').reduce((obj, key) => (obj || {})[key], dictionary) || fallback || path;
  }

  function translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.getAttribute('data-i18n-ph');
      const text = t(key);
      if (text) el.setAttribute('placeholder', text);
    });
  }

  async function changeLanguage(lang) {
    if (LOCALES.includes(lang)) {
      await loadDictionary(lang);
      translateDOM();
    }
  }

  return { init, t, changeLanguage, getLocale: () => currentLocale };
})();
```

### Estructura de Diccionario Modelo (`locales/es.json`):
```json
{
  "brand": {
    "title": "FenixFrame",
    "subtitle": "Lienzo fotografico digital soberano"
  },
  "menu": {
    "fullscreen": "Modo Pantalla Completa",
    "settings": "Ajustes del Lienzo",
    "add_photos": "Añadir Fotografias",
    "reset_data": "Restablecer Datos Locales"
  },
  "settings": {
    "license_section": "Estado de Licencia",
    "license_placeholder": "Introduce tu clave de Lemon Squeezy",
    "btn_activate": "Validar Clave",
    "transition_interval": "Intervalo de Transicion",
    "seconds": "segundos",
    "language": "Idioma del Sistema",
    "burn_in_guard": "Proteccion contra Degradacion OLED"
  },
  "ads": {
    "badge": "SELECCION PATROCINADA",
    "scan_instruction": "Escanea el codigo con tu telefono para ver especificaciones"
  },
  "toasts": {
    "activated": "Licencia activada con exito. Bienvenido a FenixFrame",
    "invalid_key": "Clave no valida o activaciones agotadas",
    "data_reset": "Memoria local restablecida correctamente"
  }
}
```

---

## 7. Asistente de Instalación No Invasivo (`js/installHelper.js`)

Solo debe operar en `app.html` cuando el usuario pulsa deliberadamente el botón de pantalla completa en el HUD:

```javascript
const InstallHelper = (() => {
  let deferredPrompt = null;

  function init() {
    // Si ya corre en modo standalone, no registrar asistentes
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Vincular al botón manual de la interfaz (cero modales intrusivos por temporizador)
    const btnTrigger = document.getElementById('btn-manual-install');
    if (btnTrigger) {
      btnTrigger.addEventListener('click', triggerInstallFlow);
    }
  }

  function triggerInstallFlow() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
      });
    } else if (isIOS) {
      showIOSGuide();
    } else {
      LicenseManager.showToast('Pulsa el menu de tu navegador y selecciona "Añadir a pantalla de inicio"', 'info');
    }
  }

  function showIOSGuide() {
    const existing = document.getElementById('sf-ios-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sf-ios-modal';
    modal.className = 'sf-modal-backdrop';
    modal.innerHTML = `
      <div class="sf-glass-card sf-modal-card">
        <div class="sf-modal-header">
          <span class="sf-modal-title">INSTALACION EN PANTALLA COMPLETA</span>
        </div>
        <div class="sf-modal-row">
          <div class="sf-badge-num">1</div>
          <div class="sf-row-text">Pulsa el boton <strong>Compartir</strong> en la barra inferior de Safari.</div>
        </div>
        <div class="sf-modal-row">
          <div class="sf-badge-num">2</div>
          <div class="sf-row-text">Selecciona <strong>"Añadir a la pantalla de inicio"</strong>.</div>
        </div>
        <button id="btn-close-ios-guide" class="sf-btn-action">Entendido</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-close-ios-guide').addEventListener('click', () => modal.remove());
  }

  return { init, triggerInstallFlow };
})();

window.addEventListener('DOMContentLoaded', InstallHelper.init);
```

---

## 8. Sistema de Notificaciones HUD Flotante (Apple SF Toast)

Sustituye por completo cualquier llamada a las alertas nativas del navegador:

```javascript
function showToast(message, type = 'info') {
  const old = document.getElementById('sf-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'sf-toast';
  toast.className = `sf-toast-pill sf-toast-${type}`;

  const iconColor = type === 'success' ? '#22c55e' : (type === 'error' ? '#ef4444' : '#38bdf8');
  
  toast.innerHTML = `
    <div class="sf-toast-icon">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'success' 
          ? '<polyline points="20 6 9 17 4 12" />' 
          : '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />'}
      </svg>
    </div>
    <span class="sf-toast-text">${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('sf-toast-leave');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
```

---

## 9. Lista de Verificación para Antigravity antes de Entrega

1. **Prueba de Intrusión Cero:** Al entrar en `index.html`, navegar la landing y leer el contenido, no debe aparecer ningún pop-up, aviso modal ni solicitud de instalación PWA.
2. **Prueba de Rutas:** Verificar que el botón de prueba de la landing abra `app.html` limpiamente.
3. **Prueba de Activación:** Probar la URL `app.html?license_key=TEST-KEY-1234` y comprobar que la clave se procese, se limpie la URL del navegador y aparezca el Toast HUD de confirmación.
4. **Inspección de Almacenamiento:** Cargar más de 20 fotografías locales y verificar en las herramientas de desarrollo (*DevTools -> Application -> IndexedDB*) que las fotos se alojen en `FenixFrameDB` y no en `localStorage`.
5. **Comprobación de Ausencia de Emojis:** Ejecutar una búsqueda de caracteres en todo el árbol del repositorio asegurando que no exista un solo emoji en HTML, CSS, JS ni JSON.
6. **Verificación PWA `short_name`:** Asegurar que el archivo `manifest.webmanifest` declare `"short_name": "FenixFoto"`.