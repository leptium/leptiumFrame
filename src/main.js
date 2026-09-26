import './ui/styles/main.css';
import { WakeLock, MediaPicker } from './hal/index.js';
import { store } from './core/state/store.js';
import { weatherService } from './core/weather/weatherService.js';
import { BurnInShield } from './core/burnin/burnInShield.js';
import { CollageEngine, getCollagePhotoSet } from './core/collage/collageEngine.js';
import { i18n } from './core/i18n/index.js';
import { sponsorEngine } from './core/ads/sponsorEngine.js';
import { getUnsplashPhotoBlobs } from './core/collage/unsplashPhotos.js';
import { cloudConnector } from './core/cloud/cloudConnector.js';
import { licenseManager } from './core/license/licenseManager.js';
import { showHudToast } from './ui/hud/hudToast.js';
import { InstallHelper } from './core/install/installHelper.js';
import { FenixDB } from './core/storage/db.js';
import { getCheckoutUrl } from './core/config/payments.js';
import { DEMO_CATALOG } from './core/catalog/demoCatalog.js';

export { DEMO_CATALOG, getCollagePhotoSet };
if (typeof window !== 'undefined') {
  window.DEMO_CATALOG = DEMO_CATALOG;
  window.getCollagePhotoSet = getCollagePhotoSet;
}

// Activar WakeLock para mantener pantalla encendida 24/7 con fallback de video canvas invisible
WakeLock.enable().catch((err) => console.warn('[WakeLock] Inicial:', err));

// Subsistema Determinista de Perfiles de Dispositivo (TV, Phone, Legacy Tablet, Desktop)
function evaluateAndApplyDeviceProfile() {
  const root = document.documentElement;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  const maxDim = Math.max(window.innerWidth, window.innerHeight);
  const ua = (navigator.userAgent || '').toLowerCase();
  const isTV = /smart-tv|tizen|webos|googletv|android tv|crkey|appletv/i.test(ua);

  let profile = 'desktop';
  if (isTV || (!isTouch && maxDim >= 1920 && minDim >= 1080)) {
    profile = 'tv';
  } else if (isTouch && minDim < 600) {
    profile = 'phone';
  } else if (isTouch && minDim >= 600) {
    profile = 'legacy-tablet';
  }

  root.setAttribute('data-device-profile', profile);
  root.setAttribute('data-input-mode', isTouch ? 'touch' : 'pointer');
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', evaluateAndApplyDeviceProfile, { passive: true });
  window.addEventListener('orientationchange', evaluateAndApplyDeviceProfile, { passive: true });
  document.addEventListener('DOMContentLoaded', evaluateAndApplyDeviceProfile);
  evaluateAndApplyDeviceProfile();
}

// Detección inmediata de modo embebido (Landing page iframe demo)
if (typeof window !== 'undefined' && (window.self !== window.top || window.location.search.includes('embed=1'))) {
  document.documentElement.classList.add('is-embedded');
  if (document.body) document.body.classList.add('is-embedded');
  else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('is-embedded'));
}

// Iconos SVG SF-style
const icons = {
  calendar: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  location: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#32ade6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  thermometer: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>',
  camera: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  pin: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#30d158" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  sunrise: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#ffd60a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"></path></svg>',
  sun: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  moon: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#7eb6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  successCheck: '<svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#30d158" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  warning: '<svg class="sf-icon" style="color:#ffd60a;width:18px;height:18px;vertical-align:middle;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  wand: '<svg class="sf-icon" style="color:#ffd60a;width:18px;height:18px;vertical-align:middle;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2m0 16v-2m8-6h-2M4 12H2m15.5-6.5L16 7m-8 8l-1.5 1.5M19.5 17.5L18 16M6 6L4.5 4.5M2 22l10-10"></path></svg>'
};

const mesesCortos = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Elementos DOM
const elements = {};

function initDOMReferences() {
  elements.wrapper = document.getElementById('wrapper');
  elements.img = document.getElementById('displayImg');
  elements.overlay = document.getElementById('overlay');
  elements.clock = document.getElementById('clock');
  elements.currentDate = document.getElementById('currentDate');
  elements.deviceLocation = document.getElementById('deviceLocation');
  elements.weatherBox = document.getElementById('weatherBox');
  elements.greeting = document.getElementById('greeting');
  elements.greetingIcon = document.getElementById('greetingIcon');
  elements.topLeftContainer = document.getElementById('topLeftContainer');
  elements.btnBackHome = document.getElementById('btnBackHome');
  elements.topLeftPanel = document.getElementById('topLeftPanel');
  elements.topRightPanel = document.getElementById('topRightPanel');
  elements.pauseBadge = document.getElementById('pauseBadge');
  elements.btnPlayPause = document.getElementById('btnPlayPause');
  elements.iconPause = document.getElementById('icon-pause');
  elements.iconPlay = document.getElementById('icon-play');
  elements.btnInfo = document.getElementById('btnInfo');
  elements.btnCollage = document.getElementById('btnCollage');
  elements.btnHidePhoto = document.getElementById('btnHidePhoto');
  elements.btnHeart = document.getElementById('btnHeart');
  elements.btnFavFilter = document.getElementById('btnFavFilter');
  elements.btnSaveCurrent = document.getElementById('btnSaveCurrent');
  elements.progressBar = document.getElementById('progressBar');
  elements.loader = document.getElementById('loader');
  elements.settingsModal = document.getElementById('settingsModal');
  elements.chkAutoDim = document.getElementById('chkAutoDim');
  elements.chkFrame = document.getElementById('chkFrame');
  elements.filterSelect = document.getElementById('filterSelect');
  elements.cleanOverlay = document.getElementById('cleanOverlay');
  elements.cleanTimer = document.getElementById('cleanTimer');
  elements.btnToggleInfo = document.getElementById('btnToggleInfo');
  elements.infoDetailModal = document.getElementById('infoDetailModal');
  elements.collageModal = document.getElementById('collageModal');
  elements.collagePreview = document.getElementById('collagePreview');
  elements.actionToolbar = document.getElementById('actionToolbar');
  elements.collageCanvas = document.getElementById('collageCanvas');
  elements.sponsorModal = document.getElementById('sponsorModal');
  elements.photoPermissionModal = document.getElementById('photoPermissionModal');
  elements.localPhotoInput = document.getElementById('localPhotoInput');
  elements.currentSourceBadge = document.getElementById('currentSourceBadge');
  elements.cloudSyncModal = document.getElementById('cloudSyncModal');
  elements.cloudProRequiredBanner = document.getElementById('cloudProRequiredBanner');
  elements.cloudProviderSelect = document.getElementById('cloudProviderSelect');
  elements.cloudUrlInput = document.getElementById('cloudUrlInput');
  elements.btnConnectCloud = document.getElementById('btnConnectCloud');
  elements.btnDisconnectCloud = document.getElementById('btnDisconnectCloud');
  elements.currentLicenseBadge = document.getElementById('currentLicenseBadge');
  elements.licenseModal = document.getElementById('licenseModal');
  elements.licenseStatusBadge = document.getElementById('licenseStatusBadge');
  elements.licenseKeyInput = document.getElementById('licenseKeyInput');
  elements.licenseMsgBox = document.getElementById('licenseMsgBox');
  elements.btnActivateLicense = document.getElementById('btnActivateLicense');
  elements.btnDeactivateLicense = document.getElementById('btnDeactivateLicense');
  elements.buyLicenseLink = document.getElementById('buyLicenseLink');
  if (elements.buyLicenseLink) {
    elements.buyLicenseLink.href = getCheckoutUrl('pro');
  }
  elements.emptyStateContainer = document.getElementById('emptyStateContainer');
  elements.btnEmptyAddPhotos = document.getElementById('btnEmptyAddPhotos');
  elements.hiddenZeroStateShield = document.getElementById('hiddenZeroStateShield');
  elements.btnResetHiddenPhotos = document.getElementById('btnResetHiddenPhotos');
  elements.btnManualInstall = document.getElementById('btn-manual-install');
  elements.btnInstallSettings = document.getElementById('btn-install-settings');
  elements.chkFillScreen = document.getElementById('chkFillScreen');
  elements.iconFsExpand = document.getElementById('icon-fullscreen-expand');
  elements.iconFsCompress = document.getElementById('icon-fullscreen-compress');
}

// Variables de ejecución
let userLocalPhotos = [];
let activeFotos = [];
let detectedYears = {};
let photoYears = {};
let slideTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let collageDataUrl = "";
let failCount = 0;

// Gestión agresiva de memoria para WebKit / iOS Safari
let preloaderImage = null;
let imageLoadWatchdog = null;
const activeBlobUrls = new Set();

function trackBlobUrl(url) {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    activeBlobUrls.add(url);
  }
  return url;
}

function revokeBlobUrl(url) {
  if (url && typeof url === 'string' && url.startsWith('blob:') && activeBlobUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {}
    activeBlobUrls.delete(url);
  }
}

function clearAllBlobUrls() {
  for (const url of activeBlobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {}
  }
  activeBlobUrls.clear();
}

// Liberar buffers y URLs si la pestaña entra en segundo plano o se cierra
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    clearAllBlobUrls();
    if (preloaderImage) {
      preloaderImage.onload = null;
      preloaderImage.onerror = null;
      preloaderImage.src = '';
      preloaderImage.removeAttribute('src');
    }
  });
}

const collageEngine = new CollageEngine(2048, 18);
const burnInShield = new BurnInShield({ intervalMs: 15 * 60 * 1000, maxShiftPx: 2 });

function obtenerRuta(item) {
  if (!item) return '';
  const r = typeof item === 'object' ? (item.ruta || item.src || '') : item;
  if (typeof r === 'string') {
    if (r.startsWith('./assets/demo/')) {
      return r.replace('./', '/');
    }
    if (r.startsWith('assets/demo/')) {
      return '/' + r;
    }
  }
  return r;
}

function obtenerPhotoId(item) {
  if (!item) return '';
  if (typeof item === 'object' && item.id !== undefined && item.id !== null) {
    return String(item.id);
  }
  return obtenerRuta(item);
}

function isPhotoHidden(item, hiddenMap) {
  if (!item || !hiddenMap) return false;
  const id = obtenerPhotoId(item);
  const ruta = obtenerRuta(item);
  return Boolean((id && hiddenMap[id]) || (ruta && hiddenMap[ruta]));
}

// Colección curada de respaldo local para primer arranque (First-Run Empty State)
const fotosDemo = DEMO_CATALOG;

async function getPhotoBlobFromIndexedDB(id) {
  try {
    return await FenixDB.getPhotoBlobById(id);
  } catch (e) {
    console.warn('[FenixDB] Error recuperando blob por ID:', e);
    return null;
  }
}

async function loadLocalDatabasePhotos() {
  try {
    const dbPhotos = await FenixDB.getAllPhotos();
    if (dbPhotos && dbPhotos.length > 0) {
      // Revocar explícitamente URLs de blob anteriores para evitar memory leaks en WebKit
      clearAllBlobUrls();
      userLocalPhotos = dbPhotos.map((p) => ({
        id: p.id,
        blob: p.blob,
        name: (p.filename || `foto-${p.id}`).replace(/\.[a-z0-9]+$/i, ''),
        filename: p.filename || `foto-${p.id}.jpg`,
        ruta: trackBlobUrl(URL.createObjectURL(p.blob)),
        fecha: new Date(p.addedAt).toLocaleDateString(),
        camara: 'FenixFrameDB',
        lugar: p.filename || 'Foto Local'
      }));
      return userLocalPhotos;
    }
  } catch (e) {
    console.warn('[FenixDB] Error al leer fotos:', e);
  }
  return [];
}

window.triggerPickUserPhotos = () => {
  if (elements.localPhotoInput) {
    elements.localPhotoInput.click();
  }
};

window.dismissEmptyState = () => {
  if (elements.emptyStateContainer) {
    elements.emptyStateContainer.style.display = 'none';
  }
};

function indexYearsFromCatalog(catalog) {
  detectedYears = {};
  photoYears = {};
  if (!Array.isArray(catalog)) return;
  catalog.forEach((item) => {
    const ruta = obtenerRuta(item);
    const fechaRaw = typeof item === 'object' ? (item.fecha || item.date || '') : '';
    if (fechaRaw) {
      const p = String(fechaRaw).split('/');
      if (p.length === 3 && p[2]) {
        const a = p[2].trim();
        photoYears[ruta] = a;
        detectedYears[a] = true;
      } else {
        const yearMatch = String(fechaRaw).match(/\b((?:19|20)\d{2})\b/);
        if (yearMatch) {
          const a = yearMatch[1];
          photoYears[ruta] = a;
          detectedYears[a] = true;
        }
      }
    }
  });
}

window.resetLocalData = async () => {
  try {
    await FenixDB.purgeDatabase();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('leptium_hidden_ids');
    }
    await store.resetHiddenPhotos();
    store.setModoFavoritas(false);
    if (elements.btnFavFilter) elements.btnFavFilter.classList.remove('active');
    if (cloudConnector.isConnected()) {
      cloudConnector.clearConfig();
    }
    clearAllBlobUrls();
    userLocalPhotos = [];
    if (elements.localPhotoInput) {
      elements.localPhotoInput.value = '';
    }
    indexYearsFromCatalog(fotosDemo);
    rebuildYearFilter();
    activeFotos = [...fotosDemo];
    closeSettings();
    if (elements.emptyStateContainer) {
      elements.emptyStateContainer.style.display = 'none';
    }
    if (elements.currentSourceBadge) {
      elements.currentSourceBadge.innerText = i18n.t('settings.sourceDemo') || 'Galería Demo';
      elements.currentSourceBadge.style.color = '#ffd60a';
      elements.currentSourceBadge.style.background = 'rgba(255, 214, 10, 0.15)';
    }
    store.setPaused(false);
    setSlideshowPlaybackState(false);
    checkPhotoAvailability(activeFotos.length, activeFotos.length);
    store.setCurrentIndex(0);
    renderSlide();
    startInterval();
    showHudToast(i18n.t('toasts.data_reset') || 'Almacenamiento local purgado. Reproduciendo colección demo.', 'info');
  } catch (e) {
    console.error('[FenixDB] Error al vaciar almacenamiento:', e);
  }
};

window.purgeDatabaseAndRestoreDemo = window.resetLocalData;


function loadExternalCatalog() {
  return Promise.resolve();
}

/**
 * Construye una línea de metadatos segura contra XSS usando textContent para datos dinámicos.
 * @param {string} iconSvg - SVG estático interno de la aplicación
 * @param {string} textValue - Texto de metadatos (EXIF, título, fecha, ubicación)
 * @returns {HTMLDivElement}
 */
function createMetaLineNode(iconSvg, textValue) {
  const line = document.createElement('div');
  line.className = 'meta-line';
  if (iconSvg) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'meta-icon-slot';
    iconSpan.innerHTML = iconSvg;
    line.appendChild(iconSpan);
    line.appendChild(document.createTextNode(' '));
  }
  const textSpan = document.createElement('span');
  textSpan.textContent = String(textValue ?? '');
  line.appendChild(textSpan);
  return line;
}

function setOverlayMetaLines(lines) {
  if (!elements.overlay) return;
  elements.overlay.textContent = '';
  lines.forEach(({ icon, text }) => {
    elements.overlay.appendChild(createMetaLineNode(icon, text));
  });
}

function getCatalogoFotos() {
  if (Array.isArray(userLocalPhotos) && userLocalPhotos.length > 0) {
    return userLocalPhotos;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.misFotos) && window.misFotos.length > 0) {
    return window.misFotos;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.fotos) && window.fotos.length > 0) {
    return window.fotos;
  }
  return fotosDemo;
}

// --------------------------------------------------------------------------
// Reloj, Saludo y Clima
// --------------------------------------------------------------------------
function updateClockAndStatus() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hDisplay = hours % 12 || 12;
  const mDisplay = minutes < 10 ? '0' + minutes : minutes;

  if (elements.clock) {
    elements.clock.innerText = `${hDisplay}:${mDisplay} ${ampm}`;
  }

  if (elements.currentDate) {
    const lang = i18n.getLanguage() || 'es';
    try {
      const dateFormatted = now.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' });
      const capitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
      elements.currentDate.innerHTML = `${icons.calendar} ${capitalized}`;
    } catch (e) {
      const dia = diasSemana[now.getDay()];
      const numDia = now.getDate();
      const mes = mesesCortos[now.getMonth()];
      elements.currentDate.innerHTML = `${icons.calendar} ${dia}, ${numDia} ${mes}`;
    }
  }

  if (elements.greeting && elements.greetingIcon) {
    if (hours >= 5 && hours < 12) {
      elements.greeting.innerText = i18n.t('app.greetings.morning');
      elements.greetingIcon.innerHTML = icons.sunrise;
    } else if (hours >= 12 && hours < 19) {
      elements.greeting.innerText = i18n.t('app.greetings.afternoon');
      elements.greetingIcon.innerHTML = icons.sun;
    } else {
      elements.greeting.innerText = i18n.t('app.greetings.evening');
      elements.greetingIcon.innerHTML = icons.moon;
    }
  }

  const { autoDim } = store.getState();
  if (autoDim && (hours >= 22 || hours < 7)) {
    elements.wrapper.classList.add('night-dim');
  } else {
    elements.wrapper.classList.remove('night-dim');
  }
}

// --------------------------------------------------------------------------
// Lógica de Renderizado de Fotos y Diapositivas
// --------------------------------------------------------------------------
function resetProgressBar() {
  if (!elements.progressBar) return;
  elements.progressBar.style.transition = 'none';
  elements.progressBar.style.webkitTransition = 'none';
  elements.progressBar.style.width = '0%';

  setTimeout(() => {
    const { isPaused } = store.getState();
    if (!isPaused && elements.progressBar) {
      elements.progressBar.style.transition = 'width 29.8s linear';
      elements.progressBar.style.webkitTransition = 'width 29.8s linear';
      elements.progressBar.style.width = '100%';
    }
  }, 50);
}

function renderSlide() {
  if (!activeFotos || activeFotos.length === 0) {
    const totalInDB = getCatalogoFotos().length;
    if (!checkPhotoAvailability(totalInDB, 0)) {
      return;
    }
    activeFotos = [...fotosDemo];
  }
  const state = store.getState();
  const idx = state.currentIndex || 0;
  const item = activeFotos[idx] || activeFotos[0];
  const photoPath = obtenerRuta(item);

  cerrarInfoDetallada();
  if (elements.img) elements.img.classList.remove('visible');
  if (elements.loader) elements.loader.style.display = 'block';

  // 1. Limpiar temporizador watchdog previo
  if (imageLoadWatchdog) {
    clearTimeout(imageLoadWatchdog);
    imageLoadWatchdog = null;
  }

  // 2. Reutilizar instancia preloader (evita alloc de new Image() en cada ciclo y limpia buffer en WebKit)
  if (preloaderImage) {
    preloaderImage.onload = null;
    preloaderImage.onerror = null;
    preloaderImage.src = '';
    preloaderImage.removeAttribute('src');
  } else {
    preloaderImage = new Image();
  }

  // Manejo centralizado de fallos de red intermitente o decodificación
  const handleSlideFailure = (reason = '') => {
    if (imageLoadWatchdog) {
      clearTimeout(imageLoadWatchdog);
      imageLoadWatchdog = null;
    }
    if (preloaderImage) {
      preloaderImage.onload = null;
      preloaderImage.onerror = null;
      preloaderImage.src = '';
      preloaderImage.removeAttribute('src');
    }
    if (elements.loader) elements.loader.style.display = 'none';

    failCount++;
    console.warn(`[ImageLoop] Error o timeout en descarga (${failCount}): ${photoPath} ${reason}`);

    // Si fallan 5 fotos consecutivas y no estamos en demo, recuperar demo local offline garantizado
    if (failCount >= 5 && activeFotos !== fotosDemo && fotosDemo.length > 0) {
      console.warn('[ImageLoop] Múltiples fallos de red. Conmutando a colección demo local offline');
      activeFotos = [...fotosDemo];
      failCount = 0;
      store.setCurrentIndex(0);
      setTimeout(renderSlide, 400);
      return;
    }

    // Saltar limpiamente a la siguiente foto sin romper el temporizador de la diapositiva
    if (activeFotos.length > 1) {
      const nextIdx = (idx + 1) % activeFotos.length;
      store.setCurrentIndex(nextIdx);
      setTimeout(renderSlide, 350);
    } else {
      setOverlayMetaLines([{ icon: icons.warning, text: i18n.t('app.errors.loadingPhotos') || 'Error al cargar fotos' }]);
    }
  };

  // 3. Watchdog contra cuelgues de red intermitente (máximo 8 segundos de espera)
  imageLoadWatchdog = setTimeout(() => {
    handleSlideFailure('(Watchdog Timeout)');
  }, 8000);

  // 4. Precarga exitosa: reutilizar nodo DOM principal y liberar buffer de precarga
  preloaderImage.onload = () => {
    if (imageLoadWatchdog) {
      clearTimeout(imageLoadWatchdog);
      imageLoadWatchdog = null;
    }

    if (elements.img) {
      elements.img.onload = () => {
        elements.img.classList.add('visible');
        if (elements.loader) elements.loader.style.display = 'none';
        // Liberar inmediatamente el src del preloader para no tener doble copia en RAM/GPU
        if (preloaderImage) {
          preloaderImage.onload = null;
          preloaderImage.onerror = null;
          preloaderImage.src = '';
          preloaderImage.removeAttribute('src');
        }
      };
      elements.img.onerror = () => {
        handleSlideFailure('(DOM img error)');
      };
      elements.img.src = photoPath;
    } else {
      if (elements.loader) elements.loader.style.display = 'none';
    }

    failCount = 0;

    const percent = (((idx + 1) / activeFotos.length) * 100).toFixed(1);
    const countInfo = `${idx + 1}/${activeFotos.length} (${percent}%)`;

    actualizarIconoFavorita(photoPath);

    const metaLines = [];

    if (typeof item === 'object' && item !== null) {
      const fechaRaw = item.fecha || item.date || '';
      const lugarRaw = item.lugar || item.location || '';
      const tituloRaw = item.title || '';

      if (fechaRaw || lugarRaw || tituloRaw) {
        if (fechaRaw) {
          const p = String(fechaRaw).split('/');
          if (p.length === 3) {
            const mIdx = parseInt(p[1], 10) - 1;
            const nomMes = mesesCortos[mIdx] || p[1];
            metaLines.push({ icon: icons.calendar, text: `${p[0]} ${nomMes} ${p[2]}  •  ${countInfo}` });
          } else {
            metaLines.push({ icon: icons.calendar, text: `${fechaRaw}  •  ${countInfo}` });
          }
        } else {
          metaLines.push({ icon: icons.camera, text: `Foto ${countInfo}` });
        }

        if (tituloRaw && lugarRaw) {
          metaLines.push({ icon: icons.pin, text: `${tituloRaw} — ${lugarRaw}` });
        } else if (lugarRaw) {
          metaLines.push({ icon: icons.pin, text: String(lugarRaw) });
        } else if (tituloRaw) {
          metaLines.push({ icon: icons.pin, text: String(tituloRaw) });
        }
      } else {
        metaLines.push({ icon: icons.camera, text: `Foto ${countInfo}` });
      }
    } else {
      metaLines.push({ icon: icons.camera, text: `Foto ${countInfo}` });
    }

    setOverlayMetaLines(metaLines);
  };

  preloaderImage.onerror = () => {
    handleSlideFailure('(Network/decode error)');
  };

  preloaderImage.src = photoPath;
}


let sponsorCountdownTimer = null;

function showSponsorCard() {
  if (!elements.sponsorModal) return;
  const product = sponsorEngine.getNextAd();
  elements.sponsorModal.innerHTML = sponsorEngine.renderAdModalHTML(product);
  elements.sponsorModal.classList.add('active');

  if (slideTimer) clearInterval(slideTimer);
  if (sponsorCountdownTimer) clearTimeout(sponsorCountdownTimer);

  window.closeSponsorCard = () => {
    if (sponsorCountdownTimer) {
      clearTimeout(sponsorCountdownTimer);
      sponsorCountdownTimer = null;
    }
    elements.sponsorModal.classList.remove('active');
    elements.sponsorModal.innerHTML = '';
    advanceToNextPhoto();
  };

  // Auto-cierre de 10 segundos con progreso visual Apple SF
  sponsorCountdownTimer = setTimeout(() => {
    if (elements.sponsorModal && elements.sponsorModal.classList.contains('active')) {
      window.closeSponsorCard();
    }
  }, 10000);
}

function advanceToNextPhoto() {
  const { currentIndex } = store.getState();
  const nextIdx = (currentIndex + 1) % activeFotos.length;
  store.setCurrentIndex(nextIdx);
  renderSlide();
  startInterval();
}

function nextPhoto() {
  cerrarInfoDetallada();
  sponsorEngine.incrementPhotoCount();
  if (sponsorEngine.shouldShowAd()) {
    showSponsorCard();
    return;
  }
  advanceToNextPhoto();
}

function prevPhoto() {
  cerrarInfoDetallada();
  const { currentIndex } = store.getState();
  const prevIdx = (currentIndex - 1 + activeFotos.length) % activeFotos.length;
  store.setCurrentIndex(prevIdx);
  renderSlide();
  startInterval();
}

function startInterval() {
  if (slideTimer) clearInterval(slideTimer);
  resetProgressBar();
  slideTimer = setInterval(() => {
    const { isPaused } = store.getState();
    if (!isPaused) {
      nextPhoto();
    }
  }, 30000);
}

function stopSlideshow() {
  if (slideTimer) {
    clearInterval(slideTimer);
    slideTimer = null;
  }
  if (imageLoadWatchdog) {
    clearTimeout(imageLoadWatchdog);
    imageLoadWatchdog = null;
  }
  if (elements.progressBar) {
    elements.progressBar.style.transition = 'none';
    elements.progressBar.style.webkitTransition = 'none';
    elements.progressBar.style.width = '0%';
  }
  if (elements.loader) {
    elements.loader.style.display = 'none';
  }
}

function checkPhotoAvailability(totalInDB, visibleCount) {
  const zeroStateShield = elements.hiddenZeroStateShield || document.getElementById('hiddenZeroStateShield');
  const toolbar = elements.actionToolbar || document.getElementById('actionToolbar');

  // Si hay fotos en base de datos pero todas fueron ocultadas por el usuario
  if (totalInDB > 0 && visibleCount === 0) {
    if (toolbar) toolbar.style.display = 'none';
    if (elements.emptyStateContainer) elements.emptyStateContainer.style.display = 'none';
    if (elements.img) elements.img.classList.remove('visible');
    if (elements.overlay) elements.overlay.innerHTML = '';
    if (zeroStateShield) zeroStateShield.removeAttribute('hidden');
    stopSlideshow(); // Detener loops y watchdog
    return false;
  }

  // Hay fotos visibles
  if (zeroStateShield) zeroStateShield.setAttribute('hidden', '');
  if (toolbar) toolbar.style.display = '';
  return true;
}

function reloadVisiblePhotosAndStart() {
  const lista = getCatalogoFotos();
  const { hiddenPhotos, modoFavoritas, favoritas } = store.getState();
  let baseList = lista.filter((item) => !isPhotoHidden(item, hiddenPhotos));

  if (modoFavoritas) {
    const favList = baseList.filter((p) => favoritas.includes(obtenerRuta(p)));
    if (favList.length > 0) {
      baseList = favList;
    } else {
      store.setModoFavoritas(false);
      if (elements.btnFavFilter) elements.btnFavFilter.classList.remove('active');
    }
  }

  activeFotos = baseList.slice(0);
  if (!checkPhotoAvailability(lista.length, activeFotos.length)) {
    return;
  }

  activeFotos.sort(() => 0.5 - Math.random());
  store.setCurrentIndex(0);
  renderSlide();
  startInterval();
}

function setSlideshowPlaybackState(isPaused) {
  const paused = Boolean(isPaused);
  const toolbar = elements.actionToolbar || document.getElementById('actionToolbar');

  if (paused) {
    document.body.classList.add('canvas-paused');
    if (toolbar) toolbar.classList.add('is-paused');
  } else {
    document.body.classList.remove('canvas-paused');
    if (toolbar) toolbar.classList.remove('is-paused');
  }

  if (elements.iconPause && elements.iconPlay) {
    elements.iconPause.style.display = paused ? 'none' : 'block';
    elements.iconPlay.style.display = paused ? 'block' : 'none';
  }
}

function togglePause(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const { isPaused } = store.getState();
  const newPaused = !isPaused;
  store.setPaused(newPaused);

  setSlideshowPlaybackState(newPaused);

  if (newPaused) {
    if (elements.progressBar) elements.progressBar.style.width = '0%';
  } else {
    cerrarInfoDetallada();
    resetProgressBar();
  }
}

// --------------------------------------------------------------------------
// Favoritos y Filtros
// --------------------------------------------------------------------------
function actualizarIconoFavorita(ruta) {
  if (store.isFavorita(ruta)) {
    elements.btnHeart.classList.add('active');
  } else {
    elements.btnHeart.classList.remove('active');
  }
}

async function toggleFavorita(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (!activeFotos || activeFotos.length === 0) return;
  const { currentIndex, modoFavoritas } = store.getState();
  const ruta = obtenerRuta(activeFotos[currentIndex]);

  const isFav = await store.toggleFavorita(ruta);
  actualizarIconoFavorita(ruta);

  if (modoFavoritas && !isFav) {
    activeFotos.splice(currentIndex, 1);
    if (activeFotos.length === 0) {
      toggleModoFavoritas();
      return;
    }
    if (currentIndex >= activeFotos.length) store.setCurrentIndex(0);
    renderSlide();
  }
}

function toggleModoFavoritas(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const lista = getCatalogoFotos();
  const { modoFavoritas, hiddenPhotos, favoritas } = store.getState();
  const nuevoModo = !modoFavoritas;

  if (nuevoModo) {
    const favs = lista.filter((p) => {
      const r = obtenerRuta(p);
      return favoritas.includes(r) && !isPhotoHidden(p, hiddenPhotos);
    });
    if (favs.length === 0) {
      showHudToast(i18n.t('app.noFavoritesPrompt') || 'Añade fotos a favoritas tocando el icono de corazón', 'info');
      return;
    }
    store.setModoFavoritas(true);
    elements.btnFavFilter.classList.add('active');
    activeFotos = favs.slice(0);
  } else {
    store.setModoFavoritas(false);
    elements.btnFavFilter.classList.remove('active');
    activeFotos = lista.filter((p) => !isPhotoHidden(p, hiddenPhotos));
  }

  if (!checkPhotoAvailability(lista.length, activeFotos.length)) {
    return;
  }

  activeFotos.sort(() => 0.5 - Math.random());
  store.setCurrentIndex(0);
  renderSlide();
  startInterval();
}

async function hideCurrentPhoto(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (!activeFotos || activeFotos.length === 0) return;

  const { currentIndex } = store.getState();
  const currentItem = activeFotos[currentIndex];
  const photoId = obtenerPhotoId(currentItem);
  const rutaActual = obtenerRuta(currentItem);
  if (photoId) await store.hidePhoto(photoId);
  if (rutaActual && rutaActual !== photoId) await store.hidePhoto(rutaActual);

  activeFotos.splice(currentIndex, 1);

  const totalInDB = getCatalogoFotos().length;
  if (!checkPhotoAvailability(totalInDB, activeFotos.length)) {
    return;
  }

  if (currentIndex >= activeFotos.length) store.setCurrentIndex(0);
  renderSlide();
  resetProgressBar();
}

async function resetHiddenPhotos() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('leptium_hidden_ids');
  }
  await store.resetHiddenPhotos();
  closeSettings();
  reloadVisiblePhotosAndStart();
  showHudToast(i18n.t('toasts.photos_restored') || 'Fotos restauradas a la colección', 'success');
}

function applyFilter() {
  const val = elements.filterSelect ? elements.filterSelect.value : 'all';
  const lista = getCatalogoFotos();
  const { hiddenPhotos, modoFavoritas, favoritas } = store.getState();

  let baseList = lista.filter((item) => !isPhotoHidden(item, hiddenPhotos));

  if (modoFavoritas) {
    baseList = baseList.filter((p) => favoritas.includes(obtenerRuta(p)));
  }

  if (val === 'all') {
    activeFotos = baseList.slice(0);
  } else {
    activeFotos = baseList.filter((item) => photoYears[obtenerRuta(item)] === val);
    if (activeFotos.length === 0) activeFotos = baseList.slice(0);
  }

  closeSettings();
  if (!checkPhotoAvailability(lista.length, activeFotos.length)) {
    return;
  }

  activeFotos.sort(() => 0.5 - Math.random());
  store.setCurrentIndex(0);
  renderSlide();
  startInterval();
}

function rebuildYearFilter() {
  if (!elements.filterSelect) return;
  const currentVal = elements.filterSelect.value;
  elements.filterSelect.innerHTML = `<option value="all" data-i18n="settings.allPhotos">${i18n.t('settings.allPhotos') || 'Todas las fotos'}</option>`;
  const yearsList = Object.keys(detectedYears).sort().reverse();
  yearsList.forEach((y) => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.innerText = `${i18n.t('app.year') || 'Año'} ${y}`;
    elements.filterSelect.appendChild(opt);
  });
  elements.filterSelect.value = currentVal;
}

// --------------------------------------------------------------------------
// Más Información Técnica
// --------------------------------------------------------------------------
function toggleInfoDetallada(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  if (elements.infoDetailModal.style.display === 'block') {
    elements.infoDetailModal.style.display = 'none';
    return;
  }

  if (!activeFotos || activeFotos.length === 0) return;
  const { currentIndex } = store.getState();
  const item = activeFotos[currentIndex];
  const ruta = obtenerRuta(item);
  const nombreArchivo = (typeof item === 'object' && item.filename) ? item.filename : (ruta.split('/').pop() || 'foto.jpg');
  const dimensiones = elements.img.naturalWidth && elements.img.naturalHeight
    ? `${elements.img.naturalWidth} × ${elements.img.naturalHeight}`
    : (i18n.t('app.nativeResolution') || 'Resolución nativa');
  const titulo = typeof item === 'object' && item.title ? item.title : '';
  const fecha = typeof item === 'object' && (item.fecha || item.date) ? (item.fecha || item.date) : (i18n.t('app.noDate') || 'No registrada');
  const lugar = typeof item === 'object' && (item.lugar || item.location) ? (item.lugar || item.location) : (i18n.t('app.noLocation') || 'Sin ubicación');
  const camara = typeof item === 'object' && (item.camara || item.camera) ? (item.camara || item.camera) : '';
  const nota = typeof item === 'object' && item.note ? item.note : '';

  elements.infoDetailModal.textContent = '';

  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'font-weight:600;margin-bottom:8px;font-size:1.05em;letter-spacing:0.5px;';
  headerDiv.textContent = titulo || i18n.t('app.photoDetails') || 'Detalles de la foto';
  elements.infoDetailModal.appendChild(headerDiv);

  const appendDetailRow = (labelText, valText) => {
    const row = document.createElement('div');
    row.className = 'detail-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'detail-label';
    labelSpan.textContent = String(labelText ?? '');
    const valSpan = document.createElement('span');
    valSpan.className = 'detail-val';
    valSpan.textContent = String(valText ?? '');
    row.appendChild(labelSpan);
    row.appendChild(valSpan);
    elements.infoDetailModal.appendChild(row);
  };

  appendDetailRow(i18n.t('app.file') || 'Archivo', nombreArchivo);
  appendDetailRow(i18n.t('app.resolution') || 'Resolución', dimensiones);
  appendDetailRow(i18n.t('app.date') || 'Fecha', fecha);
  appendDetailRow(i18n.t('app.location') || 'Lugar', lugar);
  if (camara) {
    appendDetailRow(i18n.t('app.camera') || 'Cámara', camara);
  }
  if (nota) {
    const noteDiv = document.createElement('div');
    noteDiv.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.12);font-size:0.9em;color:rgba(255,255,255,0.82);line-height:1.4;';
    noteDiv.textContent = String(nota);
    elements.infoDetailModal.appendChild(noteDiv);
  }

  elements.infoDetailModal.style.display = 'block';
}

function cerrarInfoDetallada() {
  if (elements.infoDetailModal) elements.infoDetailModal.style.display = 'none';
}

// --------------------------------------------------------------------------
// Guardado de Fotos y Collages (Reemplaza el servidor Python por HAL)
// --------------------------------------------------------------------------
function domImageToBlob(imgElement) {
  return new Promise((resolve) => {
    if (!imgElement || !(imgElement.naturalWidth || imgElement.width)) {
      resolve(null);
      return;
    }
    try {
      const c = document.createElement('canvas');
      c.width = imgElement.naturalWidth || imgElement.width;
      c.height = imgElement.naturalHeight || imgElement.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      c.toBlob(
        (b) => {
          c.width = 1;
          c.height = 1;
          resolve(b || null);
        },
        'image/jpeg',
        0.92
      );
    } catch (_) {
      resolve(null);
    }
  });
}

async function downloadCurrentImage(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }

  elements.overlay.classList.remove('paused-hidden');
  setOverlayMetaLines([{ icon: icons.camera, text: i18n.t('app.savingDevice') || 'Guardando en dispositivo...' }]);

  try {
    // 1. Obtener el blob original directamente de IndexedDB mediante el ID de la foto activa
    // (o desde la referencia al Blob en memoria del carrusel, nunca desde fetch(img.src))
    const { currentIndex } = store.getState();
    const activePhoto = Array.isArray(activeFotos) ? activeFotos[currentIndex] : null;
    let blob = activePhoto?.blob || null;

    if (!blob && activePhoto?.id !== undefined && activePhoto?.id !== null) {
      blob = await getPhotoBlobFromIndexedDB(activePhoto.id);
    }

    // Si es una foto del catálogo demo ya decodificada en el DOM, extraer binario directo desde el nodo <img>
    if (!blob && elements.img) {
      blob = await domImageToBlob(elements.img);
    }

    if (!blob) {
      throw new Error('No se pudo recuperar el binario de la imagen');
    }

    // 2. Crear URL temporal exclusiva para la descarga
    const rawName = (activePhoto?.name || activePhoto?.id || Date.now()).toString().replace(/\.[a-z0-9]+$/i, '');
    const tempUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = tempUrl;
    downloadLink.download = `fenixframe-${rawName}.jpg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 3. Revocar inmediatamente el puntero temporal
    setTimeout(() => URL.revokeObjectURL(tempUrl), 1000);

    setOverlayMetaLines([{ icon: icons.successCheck, text: i18n.t('app.saved') || 'Guardada con éxito' }]);
  } catch (error) {
    console.error('Error al descargar fotografia:', error);
    setOverlayMetaLines([{ icon: icons.warning, text: error.message || 'No se pudo guardar' }]);
  }

  setTimeout(() => {
    const { isPaused } = store.getState();
    if (isPaused) {
      elements.overlay.classList.add('paused-hidden');
    } else {
      renderSlide();
    }
  }, 2000);
}

const guardarFotoActual = downloadCurrentImage;

async function generarCollage(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }

  // Si hay fotos visibles en reproducción (locales, nube o catálogo demo), ensamblar collage directo
  // garantizando la foto activa en el cuadrante superior izquierdo + 3 aleatorias
  if (Array.isArray(activeFotos) && activeFotos.length > 0) {
    await ejecutarEnsambladoCollage(activeFotos);
    return;
  }

  await ejecutarEnsambladoCollage(getCatalogoFotos());
}

async function ejecutarEnsambladoCollage(fotosDisponibles) {
  elements.overlay.classList.remove('paused-hidden');
  setOverlayMetaLines([{ icon: icons.wand, text: i18n.t('collage.assembling') }]);

  const { currentIndex, hiddenPhotos } = store.getState();
  const rawPool = (Array.isArray(fotosDisponibles) && fotosDisponibles.length > 0)
    ? fotosDisponibles
    : (Array.isArray(activeFotos) && activeFotos.length > 0 ? activeFotos : getCatalogoFotos());

  // Filtrar fotos ocultas de la reserva disponible
  const visiblePool = rawPool.filter((item) => !isPhotoHidden(item, hiddenPhotos));
  const effectivePool = visiblePool.length > 0 ? visiblePool : rawPool;

  // Foto activa actual obligatoria en el primer cuadrante (superior izquierdo)
  const currentPhoto = (Array.isArray(activeFotos) && activeFotos[currentIndex])
    ? activeFotos[currentIndex]
    : effectivePool[0];

  const selectedItems = getCollagePhotoSet(currentPhoto, effectivePool);
  const seleccion = selectedItems.map((item) => obtenerRuta(item)).filter(Boolean);

  try {
    const watermarkText = i18n.t('collage.watermark');
    const qrPromptText = i18n.t('collage.scanPrompt');
    const showWatermark = !licenseManager.isPaid();
    const currentLang = typeof i18n.getLanguage === 'function' ? i18n.getLanguage() : 'en';
    collageDataUrl = await collageEngine.generate2x2(seleccion, elements.collageCanvas, watermarkText, qrPromptText, showWatermark, currentLang);
    elements.collagePreview.src = collageDataUrl;
    elements.collageModal.style.display = 'flex';
    const { isPaused } = store.getState();
    if (isPaused) elements.overlay.classList.add('paused-hidden');
    else renderSlide();
  } catch (err) {
    console.error('Error generando collage:', err);
    setOverlayMetaLines([{ icon: icons.warning, text: i18n.t('app.errors.collageFailed') }]);
  }
}

function cerrarCollageModal() {
  if (elements.collageModal) elements.collageModal.style.display = 'none';
  if (elements.collagePreview) {
    elements.collagePreview.src = '';
    elements.collagePreview.removeAttribute('src');
  }
  collageDataUrl = '';
}

async function exportCollageCanvas(canvasElement = elements.collageCanvas) {
  if (!canvasElement || typeof canvasElement.toBlob !== 'function') {
    console.error('Error al convertir canvas a blob');
    return;
  }

  return new Promise((resolve) => {
    canvasElement.toBlob(
      async (blob) => {
        if (!blob) {
          console.error('Error al convertir canvas a blob');
          resolve(false);
          return;
        }

        const file = new File([blob], `fenixframe-collage-${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Intentar Web Share API si está soportada en dispositivos táctiles
        const isTouch =
          typeof window !== 'undefined' &&
          window.matchMedia('(hover: none) and (pointer: coarse)').matches;

        if (isTouch && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'leptium FenixFrame Collage',
              text: 'Collage generado desde mi lienzo digital.'
            });
            resolve(true);
            return;
          } catch (err) {
            if (err.name === 'AbortError') {
              resolve(false);
              return;
            }
            console.error('Share error:', err);
          }
        }

        // Fallback: Descarga directa en disco
        const tempUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = tempUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(tempUrl), 1000);
        resolve(true);
      },
      'image/jpeg',
      0.92
    );
  });
}

async function compartirCollageGenerado() {
  const btnGuardar = document.querySelector('.btn-modal-share');
  if (btnGuardar) {
    btnGuardar.innerText = i18n.t('app.saving') || 'Guardando...';
    btnGuardar.disabled = true;
  }

  try {
    const ok = await exportCollageCanvas(elements.collageCanvas);
    if (ok) {
      if (btnGuardar) btnGuardar.innerText = i18n.t('app.saved') || '¡Guardado!';
      setTimeout(() => {
        cerrarCollageModal();
        if (btnGuardar) {
          btnGuardar.innerText = i18n.t('app.saveCollage') || 'Guardar Collage';
          btnGuardar.disabled = false;
        }
      }, 1000);
    } else if (btnGuardar) {
      btnGuardar.innerText = i18n.t('app.saveCollage') || 'Guardar Collage';
      btnGuardar.disabled = false;
    }
  } catch (e) {
    showHudToast(`Error guardando: ${e.message}`, 'error');
    if (btnGuardar) {
      btnGuardar.innerText = i18n.t('app.saveCollage') || 'Guardar Collage';
      btnGuardar.disabled = false;
    }
  }
}

// --------------------------------------------------------------------------
// Modales y Ajustes
// --------------------------------------------------------------------------
function toggleSettings(e) {
  if (e) e.stopPropagation();
  rebuildYearFilter();
  elements.settingsModal.style.display = elements.settingsModal.style.display === 'block' ? 'none' : 'block';
}

function closeSettings() {
  if (elements.settingsModal) elements.settingsModal.style.display = 'none';
}

function startCleanMode() {
  closeSettings();
  elements.cleanOverlay.style.display = 'flex';
  let left = 30;
  elements.cleanTimer.innerText = left;
  const cTimer = setInterval(() => {
    left--;
    elements.cleanTimer.innerText = left;
    if (left <= 0) {
      clearInterval(cTimer);
      elements.cleanOverlay.style.display = 'none';
    }
  }, 1000);
}

// --------------------------------------------------------------------------
// Inicialización General
// --------------------------------------------------------------------------
async function bootstrap() {
  try {
    initDOMReferences();
    await loadExternalCatalog();

    // Activar WakeLock para mantener pantalla encendida 24/7 (no bloqueante)
    WakeLock.enable().catch((err) => console.warn('[WakeLock] No disponible:', err));

    // Iniciar almacenamiento en IndexedDB (FenixFrameDB)
    await FenixDB.open().catch((err) => console.warn('[FenixDB] Error al abrir:', err));
    const dbPhotos = await loadLocalDatabasePhotos().catch(() => []);

    // Iniciar almacenamiento y estado
    await store.init().catch((err) => console.warn('[Store] Error al inicializar:', err));

  const { autoDim, galleryFrame, fillScreen } = store.getState();
  if (elements.chkAutoDim) elements.chkAutoDim.checked = autoDim;
  if (elements.chkFrame) elements.chkFrame.checked = galleryFrame;
  if (galleryFrame) elements.wrapper?.classList.add('gallery-frame');
  applyFillScreenClass(fillScreen !== false);

  // Registrar elementos estáticos en el escudo anti-quemado de pantalla
  burnInShield.register(elements.topLeftContainer || elements.topLeftPanel);
  burnInShield.register(elements.topRightPanel);
  burnInShield.register(elements.actionToolbar);
  burnInShield.start();

  // Iniciar servicio de clima y geolocalización
  weatherService.subscribe(({ locationStr, weatherStr }) => {
    if (elements.deviceLocation) {
      if (locationStr) {
        elements.deviceLocation.innerHTML = `${icons.location} ${locationStr}`;
        elements.deviceLocation.style.display = 'flex';
      } else {
        elements.deviceLocation.style.display = 'none';
      }
    }
    if (elements.weatherBox) {
      if (weatherStr) {
        elements.weatherBox.innerHTML = `${icons.thermometer} ${weatherStr}`;
        elements.weatherBox.style.display = 'flex';
      } else {
        elements.weatherBox.style.display = 'none';
      }
    }
  });
  weatherService.start();

  // Iniciar reloj y estado cada segundo
  setInterval(updateClockAndStatus, 1000);
  updateClockAndStatus();

  // Cargar catálogo de fotos (IndexedDB FenixDB, Nube Personal Directa o Demo)
  let lista = getCatalogoFotos();

  if (cloudConnector.isConnected()) {
    try {
      const cloudPhotos = await cloudConnector.fetchPhotos();
      if (cloudPhotos && cloudPhotos.length > 0) {
        lista = cloudPhotos;
        actualizarFuenteUI('cloud');
      } else {
        actualizarFuenteUI('local');
      }
    } catch (e) {
      console.warn('[FenixFrame] Conexión inicial a la nube falló, usando fotos locales/demo:', e);
      actualizarFuenteUI('local');
    }
  } else {
    actualizarFuenteUI('local');
  }

  // Desplegar estado inicial (First-Run Empty State) si el usuario aún no tiene fotos cargadas
  if (elements.emptyStateContainer) {
    if (dbPhotos.length === 0 && !cloudConnector.isConnected()) {
      elements.emptyStateContainer.style.display = 'flex';
    } else {
      elements.emptyStateContainer.style.display = 'none';
    }
  }

  const { hiddenPhotos } = store.getState();

  lista.forEach((item) => {
    const ruta = obtenerRuta(item);
    const fechaRaw = typeof item === 'object' ? (item.fecha || item.date || '') : '';
    if (fechaRaw) {
      const p = String(fechaRaw).split('/');
      if (p.length === 3 && p[2]) {
        const a = p[2].trim();
        photoYears[ruta] = a;
        detectedYears[a] = true;
      } else {
        const yearMatch = String(fechaRaw).match(/\b((?:19|20)\d{2})\b/);
        if (yearMatch) {
          const a = yearMatch[1];
          photoYears[ruta] = a;
          detectedYears[a] = true;
        }
      }
    }
  });

  activeFotos = lista.filter((item) => !isPhotoHidden(item, hiddenPhotos));
  activeFotos.sort(() => 0.5 - Math.random());
  rebuildYearFilter();

  let lastTouchTimestamp = 0;

  // Configurar gestos táctiles (iPad / Tablet / Móvil)
  if (elements.wrapper) {
    elements.wrapper.addEventListener('touchstart', (e) => {
      // Ignorar si el toque se originó en controles interactivos, barras o botones
      if (e.target && e.target.closest && e.target.closest('#actionToolbar, #hiddenZeroStateShield, #emptyStateContainer, #topLeftContainer, #topRightPanel, #settingsModal, #collageModal, #btnMoreInfoWrapper, #cleanOverlay, #infoDetailModal, .tool-btn, .btn-more-info, .btn-modal, button, a')) {
        return;
      }
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    elements.wrapper.addEventListener('touchend', (e) => {
      // Ignorar si el toque finalizó sobre controles interactivos para no activar el toque por zonas de la foto
      if (e.target && e.target.closest && e.target.closest('#actionToolbar, #hiddenZeroStateShield, #emptyStateContainer, #topLeftContainer, #topRightPanel, #settingsModal, #collageModal, #btnMoreInfoWrapper, #cleanOverlay, #infoDetailModal, .tool-btn, .btn-more-info, .btn-modal, button, a')) {
        return;
      }

      lastTouchTimestamp = Date.now();

      if (elements.cleanOverlay && elements.cleanOverlay.style.display === 'flex') return;
      if (elements.settingsModal && elements.settingsModal.style.display === 'block') {
        closeSettings();
        return;
      }
      if (elements.collageModal && elements.collageModal.style.display === 'flex') {
        return;
      }

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Gesto swipe horizontal
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX < 0) nextPhoto();
        else prevPhoto();
        return;
      }

      // Toque por zonas
      const x = touchEndX;
      const width = window.innerWidth;
      if (x > width * 0.75) nextPhoto();
      else if (x < width * 0.25) prevPhoto();
      else togglePause();
    }, { passive: true });

    // Navegación por clic de ratón en escritorio (PC / Mac)
    elements.wrapper.addEventListener('click', (e) => {
      // Ignorar si es un clic sintético generado tras un toque en pantalla táctil
      if (Date.now() - lastTouchTimestamp < 600) return;

      // Evitar que el clic en botones, modales o toolbars cambie la foto
      if (e.target.closest('#actionToolbar, #hiddenZeroStateShield, #emptyStateContainer, #topLeftContainer, #topRightPanel, #settingsModal, #collageModal, #btnMoreInfoWrapper, #cleanOverlay, #infoDetailModal, .tool-btn, .btn-more-info, .btn-modal, button, a')) {
        return;
      }

      if (elements.cleanOverlay && elements.cleanOverlay.style.display === 'flex') return;
      if (elements.settingsModal && elements.settingsModal.style.display === 'block') {
        closeSettings();
        return;
      }
      if (elements.collageModal && elements.collageModal.style.display === 'flex') {
        return;
      }

      const x = e.clientX;
      const width = window.innerWidth;
      if (x > width * 0.75) {
        nextPhoto();
      } else if (x < width * 0.25) {
        prevPhoto();
      } else {
        togglePause();
      }
    });

    // Detener propagación de toques en las barras de herramientas
    ['actionToolbar', 'hiddenZeroStateShield', 'topLeftContainer', 'topRightPanel', 'btnMoreInfoWrapper'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        el.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });
      }
    });
  }

  // Handler de restablecimiento en el Escudo de Rescate (#hiddenZeroStateShield)
  document.getElementById('btnResetHiddenPhotos')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    localStorage.removeItem('leptium_hidden_ids');
    await store.resetHiddenPhotos();
    reloadVisiblePhotosAndStart();
  });

  // Navegación por teclado en computadora (Flechas y barra espaciadora)
  window.addEventListener('keydown', (e) => {
    if (elements.cleanOverlay && elements.cleanOverlay.style.display === 'flex') return;

    if (e.key === 'ArrowRight') {
      nextPhoto();
    } else if (e.key === 'ArrowLeft') {
      prevPhoto();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else if (e.key === 'Escape') {
      if (elements.settingsModal && elements.settingsModal.style.display === 'block') closeSettings();
      if (elements.collageModal && elements.collageModal.style.display === 'flex') cerrarCollageModal();
      if (elements.infoDetailModal && elements.infoDetailModal.style.display === 'block') cerrarInfoDetallada();
    }
  });

  // Navegación segura hacia el Home (Landing Page)
  window.navigateHome = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (_) {}
    window.location.href = '/';
  };

  // Enlazar listeners directos de toque y clic en todos los botones de retorno al home
  document.querySelectorAll('.btn-home, #btnBackHome').forEach((btn) => {
    btn.addEventListener('click', window.navigateHome);
    btn.addEventListener('touchend', (e) => {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      window.navigateHome(e);
    });
  });

  // Exponer controladores en window para compatibilidad con botones del HTML
  window.toggleSettings = toggleSettings;
  window.togglePause = togglePause;
  window.setSlideshowPlaybackState = setSlideshowPlaybackState;
  window.checkPhotoAvailability = checkPhotoAvailability;
  window.reloadVisiblePhotosAndStart = reloadVisiblePhotosAndStart;
  setSlideshowPlaybackState(store.getState().isPaused);

  window.closeSettings = closeSettings;
  window.startCleanMode = startCleanMode;
  window.hideCurrentPhoto = hideCurrentPhoto;
  window.resetHiddenPhotos = resetHiddenPhotos;
  window.applyFilter = applyFilter;
  window.toggleFavorita = toggleFavorita;
  window.toggleModoFavoritas = toggleModoFavoritas;
  window.guardarFotoActual = guardarFotoActual;
  window.downloadCurrentImage = downloadCurrentImage;
  window.generarCollage = generarCollage;
  window.cerrarCollageModal = cerrarCollageModal;
  window.compartirCollageGenerado = compartirCollageGenerado;
  window.exportCollageCanvas = exportCollageCanvas;
  window.toggleInfoDetallada = toggleInfoDetallada;
  window.closePhotoPermissionModal = () => {
    if (elements.photoPermissionModal) {
      elements.photoPermissionModal.classList.remove('active');
    }
  };
  window.confirmUseLoadedPhotos = async () => {
    window.closePhotoPermissionModal();
    await ejecutarEnsambladoCollage(userLocalPhotos);
  };
  window.confirmPickLocalPhotos = () => {
    window.closePhotoPermissionModal();
    if (elements.localPhotoInput) {
      elements.localPhotoInput.click();
    }
  };
  window.generateRandomUnsplashCollage = async () => {
    window.closePhotoPermissionModal();
    elements.overlay.classList.remove('paused-hidden');
    setOverlayMetaLines([{ icon: '', text: i18n.t('collage.downloadingUnsplash') || 'Descargando fotos de Unsplash...' }]);

    try {
      const photos = await getUnsplashPhotoBlobs(4);
      if (!photos || photos.length === 0) {
        throw new Error('No se pudieron descargar fotos de Unsplash');
      }

      photos.forEach((p) => trackBlobUrl(p.ruta));
      userLocalPhotos.push(...photos);
      activeFotos.unshift(...photos);

      store.setCurrentIndex(0);
      renderSlide();

      await ejecutarEnsambladoCollage(photos);
    } catch (err) {
      console.error('[Unsplash Collage] Error:', err);
      setOverlayMetaLines([{ icon: icons.warning, text: i18n.t('app.errors.unsplashFailed') }]);
      setTimeout(() => {
        const { isPaused } = store.getState();
        if (isPaused) elements.overlay.classList.add('paused-hidden');
        else renderSlide();
      }, 2500);
    }
  };

  // Listener para cuando el usuario selecciona fotos de su dispositivo local
  if (elements.localPhotoInput) {
    elements.localPhotoInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      for (const file of files) {
        try {
          await FenixDB.addPhoto(file, file.name);
        } catch (dbErr) {
          console.warn('[FenixDB] Error guardando foto:', dbErr);
        }
      }

      await loadLocalDatabasePhotos();
      actualizarFuenteUI('local');
      indexYearsFromCatalog(userLocalPhotos);
      rebuildYearFilter();
      const { hiddenPhotos } = store.getState();
      activeFotos = userLocalPhotos.filter((item) => !isPhotoHidden(item, hiddenPhotos));

      if (elements.emptyStateContainer) {
        elements.emptyStateContainer.style.display = 'none';
      }

      // Replicar fotos si seleccionó menos de 4 para poder componer la cuadrícula 2x2
      const pool = [...userLocalPhotos];
      while (pool.length < 4) {
        pool.push(userLocalPhotos[pool.length % userLocalPhotos.length]);
      }

      if (checkPhotoAvailability(userLocalPhotos.length, activeFotos.length)) {
        // Reiniciar índice en la nueva foto del usuario
        store.setCurrentIndex(0);
        renderSlide();
        startInterval();
      }

      // Ensamblar inmediatamente el collage 2x2 con sus fotos locales si estaba en flujo collage
      if (elements.photoPermissionModal && elements.photoPermissionModal.classList.contains('active')) {
        window.closePhotoPermissionModal();
        await ejecutarEnsambladoCollage(pool);
      }
    });
  }

  // Cerrar modal de permiso si se hace click en el fondo
  if (elements.photoPermissionModal) {
    elements.photoPermissionModal.onclick = () => {
      window.closePhotoPermissionModal();
    };
  }

  window.changeAppLanguage = (lang) => {
    i18n.setLanguage(lang);
    updateClockAndStatus();
    i18n.translateDOM();
    rebuildYearFilter();
    actualizarFuenteUI(cloudConnector.isConnected() ? 'cloud' : 'local');
    if (elements.infoDetailModal && elements.infoDetailModal.style.display === 'block') {
      elements.infoDetailModal.style.display = 'none';
      toggleInfoDetallada();
    }
    document.querySelectorAll('.lang-btn-app').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  };
  window.saveSettings = () => {
    store.setAutoDim(elements.chkAutoDim.checked);
    updateClockAndStatus();
  };
  window.toggleFrame = () => {
    const frameOn = elements.chkFrame.checked;
    store.setGalleryFrame(frameOn);
    if (frameOn) elements.wrapper.classList.add('gallery-frame');
    else elements.wrapper.classList.remove('gallery-frame');
  };
  window.toggleFillScreen = () => {
    const isFill = elements.chkFillScreen ? elements.chkFillScreen.checked : !store.getState().fillScreen;
    store.setFillScreen(isFill);
    applyFillScreenClass(isFill);
    showHudToast(isFill ? (i18n.t('settings.fillScreenCover') || 'Llenar pantalla completa activado') : (i18n.t('settings.fillScreenContain') || 'Ajuste proporcional a pantalla activado'), 'info');
  };

  function applyFillScreenClass(isFill) {
    if (elements.wrapper) elements.wrapper.classList.toggle('fill-screen', Boolean(isFill));
    if (elements.img) elements.img.classList.toggle('fill-screen', Boolean(isFill));
    if (elements.chkFillScreen) elements.chkFillScreen.checked = Boolean(isFill);
  }

  window.toggleFullScreen = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const isDocFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    
    if (!isDocFs) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err) => {
          console.warn('[Fullscreen] requestFullscreen no permitido o restringido:', err);
          InstallHelper.triggerInstallFlow();
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      } else {
        InstallHelper.triggerInstallFlow();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  function updateFullscreenIconState() {
    const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if (elements.iconFsExpand && elements.iconFsCompress) {
      elements.iconFsExpand.style.display = isFs ? 'none' : 'block';
      elements.iconFsCompress.style.display = isFs ? 'block' : 'none';
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', updateFullscreenIconState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIconState);
  }

  // Funciones de Fuente y Nube Personal Directa
  window.openCloudModal = () => {
    if (elements.settingsModal) elements.settingsModal.style.display = 'none';
    if (elements.cloudSyncModal) {
      const config = cloudConnector.getConfig();
      if (elements.cloudProviderSelect) elements.cloudProviderSelect.value = config.provider || 'google';
      if (elements.cloudUrlInput) elements.cloudUrlInput.value = config.url || '';
      if (elements.btnDisconnectCloud) {
        elements.btnDisconnectCloud.style.display = cloudConnector.isConnected() ? 'block' : 'none';
      }
      if (elements.cloudProRequiredBanner) {
        elements.cloudProRequiredBanner.style.display = licenseManager.isPro() ? 'none' : 'block';
      }
      elements.cloudSyncModal.style.display = 'flex';
    }
  };

  window.closeCloudModal = () => {
    if (elements.cloudSyncModal) elements.cloudSyncModal.style.display = 'none';
  };

  window.confirmConnectCloud = async () => {
    if (!licenseManager.isPro()) {
      showHudToast(i18n.t('cloudModal.proRequiredAlert') || 'La sincronización con Nube Personal es exclusiva de la Licencia Pro', 'warning');
      window.closeCloudModal();
      window.openLicenseModal();
      return;
    }

    if (!elements.cloudUrlInput) return;
    const url = elements.cloudUrlInput.value.trim();
    const provider = elements.cloudProviderSelect ? elements.cloudProviderSelect.value : 'google';

    if (!url) {
      showHudToast(i18n.t('cloudModal.urlLabel') || 'Por favor ingresa una URL válida', 'warning');
      return;
    }

    try {
      if (elements.overlay) {
        elements.overlay.innerText = i18n.t('app.saving') || 'Conectando a la nube...';
        elements.overlay.style.opacity = '1';
      }

      cloudConnector.saveConfig({ provider, url, enabled: true });
      const photos = await cloudConnector.fetchPhotos();

      if (photos && photos.length > 0) {
        activeFotos = photos.slice(0);
        store.setCurrentIndex(0);
        actualizarFuenteUI('cloud');
        window.closeCloudModal();
        nextPhoto();
      } else {
        showHudToast('No se encontraron imágenes en la URL proporcionada', 'warning');
      }
    } catch (err) {
      showHudToast(`Error conectando a la nube: ${err.message}`, 'error');
    } finally {
      if (elements.overlay) elements.overlay.style.opacity = '0';
    }
  };

  window.disconnectCloud = () => {
    cloudConnector.clearConfig();
    actualizarFuenteUI('local');
    window.closeCloudModal();
    activeFotos = getCatalogoFotos();
    store.setCurrentIndex(0);
    nextPhoto();
  };

  function actualizarFuenteUI(tipo) {
    if (!elements.currentSourceBadge) return;
    if (tipo === 'cloud' && cloudConnector.isConnected()) {
      elements.currentSourceBadge.setAttribute('data-i18n', 'settings.sourceCloud');
      elements.currentSourceBadge.innerText = i18n.t('settings.sourceCloud') || 'Nube Personal';
      elements.currentSourceBadge.style.color = '#32ade6';
      elements.currentSourceBadge.style.background = 'rgba(50, 173, 230, 0.18)';
    } else if (Array.isArray(userLocalPhotos) && userLocalPhotos.length > 0) {
      elements.currentSourceBadge.setAttribute('data-i18n', 'settings.sourceLocal');
      elements.currentSourceBadge.innerText = i18n.t('settings.sourceLocal') || 'Carrete / Local';
      elements.currentSourceBadge.style.color = '#ffd60a';
      elements.currentSourceBadge.style.background = 'rgba(255, 214, 10, 0.15)';
    } else {
      elements.currentSourceBadge.setAttribute('data-i18n', 'settings.sourceDemo');
      elements.currentSourceBadge.innerText = i18n.t('settings.sourceDemo') || 'Galería Demo';
      elements.currentSourceBadge.style.color = '#ffd60a';
      elements.currentSourceBadge.style.background = 'rgba(255, 214, 10, 0.15)';
    }
  }

  // Gestión de Licencia (Pro / Lifetime)
  window.openLicenseModal = () => {
    actualizarLicenciaUI();
    if (elements.licenseMsgBox) elements.licenseMsgBox.style.display = 'none';
    if (elements.licenseKeyInput) elements.licenseKeyInput.value = '';
    if (elements.licenseModal) elements.licenseModal.classList.add('active');
  };

  window.closeLicenseModal = () => {
    if (elements.licenseModal) elements.licenseModal.classList.remove('active');
  };

  window.confirmActivateLicense = async () => {
    if (!elements.licenseKeyInput) return;
    const key = elements.licenseKeyInput.value.trim();
    if (!key) return;

    if (elements.btnActivateLicense) {
      elements.btnActivateLicense.disabled = true;
      elements.btnActivateLicense.style.opacity = '0.7';
    }

    try {
      const result = await licenseManager.activate(key);
      if (elements.licenseMsgBox) {
        elements.licenseMsgBox.style.display = 'block';
        if (result.success) {
          elements.licenseMsgBox.style.background = 'rgba(48, 209, 88, 0.15)';
          elements.licenseMsgBox.style.color = '#30d158';
          elements.licenseMsgBox.style.border = '1px solid rgba(48, 209, 88, 0.3)';
          elements.licenseMsgBox.innerText = i18n.t('license.successActive') || 'Licencia activada con éxito';
          actualizarLicenciaUI();
          setTimeout(() => {
            window.closeLicenseModal();
          }, 1500);
        } else {
          elements.licenseMsgBox.style.background = 'rgba(255, 69, 58, 0.15)';
          elements.licenseMsgBox.style.color = '#ff453a';
          elements.licenseMsgBox.style.border = '1px solid rgba(255, 69, 58, 0.3)';
          elements.licenseMsgBox.innerText = i18n.t('license.invalidKey') || 'Clave de licencia inválida';
        }
      }
    } finally {
      if (elements.btnActivateLicense) {
        elements.btnActivateLicense.disabled = false;
        elements.btnActivateLicense.style.opacity = '1';
      }
    }
  };

  window.confirmDeactivateLicense = () => {
    licenseManager.deactivate();
    if (elements.licenseMsgBox) {
      elements.licenseMsgBox.style.display = 'block';
      elements.licenseMsgBox.style.background = 'rgba(255, 214, 10, 0.15)';
      elements.licenseMsgBox.style.color = '#ffd60a';
      elements.licenseMsgBox.style.border = '1px solid rgba(255, 214, 10, 0.3)';
      elements.licenseMsgBox.innerText = i18n.t('license.deactivatedNotice');
    }
    actualizarLicenciaUI();
  };

  function actualizarLicenciaUI() {
    const isPro = licenseManager.isPro();
    const isPaid = licenseManager.isPaid();

    if (elements.currentLicenseBadge) {
      if (isPro) {
        elements.currentLicenseBadge.innerText = 'Pro';
        elements.currentLicenseBadge.style.color = '#ffd60a';
        elements.currentLicenseBadge.style.background = 'rgba(255, 214, 10, 0.2)';
      } else if (isPaid) {
        elements.currentLicenseBadge.innerText = 'Basic';
        elements.currentLicenseBadge.style.color = '#32ade6';
        elements.currentLicenseBadge.style.background = 'rgba(50, 173, 230, 0.2)';
      } else {
        elements.currentLicenseBadge.innerText = 'Free';
        elements.currentLicenseBadge.style.color = 'rgba(255, 255, 255, 0.7)';
        elements.currentLicenseBadge.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    }

    if (elements.licenseStatusBadge) {
      if (isPro) {
        elements.licenseStatusBadge.innerText = i18n.t('license.badgePro');
        elements.licenseStatusBadge.style.color = '#ffd60a';
        elements.licenseStatusBadge.style.background = 'rgba(255, 214, 10, 0.18)';
      } else if (isPaid) {
        elements.licenseStatusBadge.innerText = i18n.t('license.badgeBasic');
        elements.licenseStatusBadge.style.color = '#32ade6';
        elements.licenseStatusBadge.style.background = 'rgba(50, 173, 230, 0.18)';
      } else {
        elements.licenseStatusBadge.innerText = i18n.t('license.badgeFree');
        elements.licenseStatusBadge.style.color = 'rgba(255, 255, 255, 0.7)';
        elements.licenseStatusBadge.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    }

    if (elements.btnDeactivateLicense) {
      elements.btnDeactivateLicense.style.display = isPaid ? 'block' : 'none';
    }

    if (elements.cloudProRequiredBanner) {
      elements.cloudProRequiredBanner.style.display = isPro ? 'none' : 'block';
    }
  }

  licenseManager.subscribe(() => {
    actualizarLicenciaUI();
  });

  // Cerrar modal de licencia al hacer clic en el fondo
  if (elements.licenseModal) {
    elements.licenseModal.onclick = () => {
      window.closeLicenseModal();
    };
  }

  // Cerrar modal de nube al hacer clic en el fondo
  if (elements.cloudSyncModal) {
    elements.cloudSyncModal.onclick = () => {
      window.closeCloudModal();
    };
  }

  // Click en el fondo del sponsorModal para cerrarlo
  if (elements.sponsorModal) {
    elements.sponsorModal.onclick = () => {
      if (window.closeSponsorCard) window.closeSponsorCard();
    };
  }

  // Inicializar i18n y estado de licencia en el marco digital
  actualizarLicenciaUI();
  i18n.translateDOM();
  i18n.onLanguageChange(() => {
    updateClockAndStatus();
    actualizarFuenteUI(cloudConnector.isConnected() ? 'cloud' : 'local');
    actualizarLicenciaUI();
    i18n.translateDOM();
  });

  // Marcar botón de idioma inicial en ajustes
  const curLang = i18n.getLanguage();
  document.querySelectorAll('.lang-btn-app').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === curLang);
  });

    // Inicializar Asistente de Instalación Apple SF Glass y comprobación de URL de licencia
    InstallHelper.init();
    licenseManager.init().catch(() => {});
  } catch (criticalErr) {
    console.error('[FenixFrame] Error durante bootstrap:', criticalErr);
    if (!activeFotos || activeFotos.length === 0) {
      activeFotos = [...fotosDemo];
    }
  }

  // Evaluar disponibilidad de fotos visibles antes de iniciar bucle de reproducción
  try {
    const totalInDB = getCatalogoFotos().length;
    if (checkPhotoAvailability(totalInDB, activeFotos ? activeFotos.length : 0)) {
      renderSlide();
      startInterval();
    }
  } catch (renderErr) {
    console.error('[FenixFrame] Error al renderizar slide inicial:', renderErr);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
