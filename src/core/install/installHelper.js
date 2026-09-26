/**
 * InstallHelper — FenixFrame Digital Canvas OS
 * Asistente de instalación PWA NO INVASIVO (bajo demanda exclusivamente).
 * Se activa ÚNICAMENTE cuando el usuario pulsa deliberadamente el botón #btn-manual-install.
 * Cero temporizadores intrusivos, cero avisos automáticos al cargar, estricto cumplimiento de Cero Emojis.
 */

import { i18n } from '../i18n/index.js';
import { showHudToast } from '../../ui/hud/hudToast.js';

export const InstallHelper = (() => {
  let deferredPrompt = null;
  let initialized = false;

  function isStandalone() {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  function isIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isStandardIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isStandardIOS || isIPadOS;
  }

  function init() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    // Si ya corre en modo standalone, no activar flujos
    if (isStandalone()) {
      return;
    }

    // Capturar silenciosamente el evento nativo sin mostrar banners invasivos
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Vincular a los botones manuales de la interfaz
    bindTriggers();
  }

  function bindTriggers() {
    const btnTriggerAlt = document.getElementById('btn-install-settings');
    if (btnTriggerAlt && !btnTriggerAlt._boundInstall) {
      btnTriggerAlt._boundInstall = true;
      btnTriggerAlt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerInstallFlow();
      });
    }
  }

  function closeSettingsIfOpen() {
    if (typeof window !== 'undefined' && typeof window.closeSettings === 'function') {
      window.closeSettings();
    }
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.style.display = 'none';
    }
  }

  function triggerInstallFlow() {
    closeSettingsIfOpen();

    if (isStandalone()) {
      showHudToast(i18n.t('install.alreadyInstalled') || 'La aplicación ya se encuentra instalada en pantalla completa', 'info');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        if (outcome === 'accepted') {
          showHudToast(i18n.t('install.success') || 'FenixFoto instalada con éxito', 'success');
        }
        deferredPrompt = null;
      });
    } else if (isIOS()) {
      showIOSGuide();
    } else {
      showIOSGuide();
    }
  }

  function showIOSGuide() {
    closeSettingsIfOpen();

    const existing = document.getElementById('installModal') || document.getElementById('sf-ios-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'installModal';
    modal.className = 'install-guide-overlay sf-glass-modal-backdrop';
    modal.innerHTML = `
      <div class="install-card install-guide-content sf-glass-card sf-glass-card-ios">
        <div class="sf-card-header">
          <div class="sf-indicator-dot"></div>
          <span class="sf-card-headline">${i18n.t('install.iosHeadline') || 'CONFIGURACIÓN DE PANTALLA COMPLETA'}</span>
        </div>
        <div class="install-step sf-step-row">
          <div class="sf-step-num">1</div>
          <div class="sf-step-body">
            <span>${i18n.t('install.iosStep1') || 'Pulsa el botón Compartir en la barra de Safari.'}</span>
            <div class="sf-glyph-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="install-step sf-step-row">
          <div class="sf-step-num">2</div>
          <div class="sf-step-body">
            <span>${i18n.t('install.iosStep2') || 'Selecciona "Añadir a pantalla de inicio".'}</span>
            <div class="sf-glyph-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                <rect x="3" y="3" width="18" height="18" rx="4"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
          </div>
        </div>
        <button id="btn-close-ios-guide" class="install-btn-dismiss" type="button">${i18n.t('install.iosAck') || 'Entendido'}</button>
      </div>
    `;

    modal.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    modal.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('btn-close-ios-guide');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.remove();
      });
    }

    modal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === modal) modal.remove();
    });
  }

  return {
    init,
    bindTriggers,
    triggerInstallFlow,
    isStandalone
  };
})();

if (typeof window !== 'undefined') {
  window.InstallHelper = InstallHelper;
}
