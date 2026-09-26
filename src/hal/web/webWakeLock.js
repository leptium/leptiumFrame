import { IWakeLock } from '../interfaces/IWakeLock.js';

// Video WebM minimo de 1 cuadro silencioso para fallback cuando no hay captureStream
const SILENT_WEBM_DATA_URI =
  'data:video/webm;base64,GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4EEQoWBAhhTgGcBAAAAAAAVkhFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsghV17AEAAAAAAACk';

export class WebWakeLock extends IWakeLock {
  constructor() {
    super();
    this.sentinel = null;
    this.isActive = false;
    this.fallbackVideo = null;
    this.fallbackCanvas = null;
    this.canvasTimer = null;
    this.heartbeatTimer = null;

    if (typeof document !== 'undefined') {
      // Re-adquisicion automatica al regresar a la pestana o cambiar pantalla completa
      const reacquire = async () => {
        if (this.isActive && document.visibilityState === 'visible') {
          await this.enable();
        }
      };

      document.addEventListener('visibilitychange', reacquire);
      window.addEventListener('focus', reacquire);
      document.addEventListener('fullscreenchange', reacquire);

      // Re-intento tras la primera interaccion del usuario para sortear politicas estrictas de autoplay
      const onFirstInteraction = async () => {
        if (this.isActive) {
          await this.enable();
        }
      };
      window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
      window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });
      window.addEventListener('click', onFirstInteraction, { once: true, passive: true });
    }
  }

  async isSupported() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) return true;
    if (typeof document !== 'undefined' && (document.createElement('video').play || document.createElement('canvas').captureStream)) return true;
    return false;
  }

  async enable() {
    this.isActive = true;

    // 1. Intentar Screen Wake Lock API nativa W3C
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.sentinel) {
          this.sentinel = await navigator.wakeLock.request('screen');
          this.sentinel.addEventListener('release', () => {
            this.sentinel = null;
            // Si seguimos activos y la pestana es visible, activar fallback preventivo
            if (this.isActive && document.visibilityState === 'visible') {
              this._startFallbackVideo();
            }
          });
        }
        // Si el bloqueo nativo esta activo, detener video fallback para no consumir CPU
        this._stopFallbackVideo();
        return;
      } catch (err) {
        console.warn('[WebWakeLock] Wake Lock nativo restringido o no disponible, usando fallback:', err);
      }
    }

    // 2. Si no hay soporte nativo o fue rechazado, iniciar fallback de video/canvas invisible
    this._startFallbackVideo();
  }

  _startFallbackVideo() {
    if (typeof document === 'undefined') return;
    if (this.fallbackVideo) {
      if (this.fallbackVideo.paused) {
        this.fallbackVideo.play().catch(() => {});
      }
      return;
    }

    try {
      // Crear canvas invisible para render continuo (evita suspension del hilo JS en WebKit)
      if (!this.fallbackCanvas) {
        this.fallbackCanvas = document.createElement('canvas');
        this.fallbackCanvas.width = 16;
        this.fallbackCanvas.height = 16;
        const ctx = this.fallbackCanvas.getContext('2d');
        if (ctx) {
          let step = 0;
          this.canvasTimer = setInterval(() => {
            if (!this.isActive) return;
            step = (step + 1) % 255;
            ctx.fillStyle = 'rgb(' + step + ',' + step + ',' + step + ')';
            ctx.fillRect(0, 0, 16, 16);
          }, 1000);
        }
      }

      // Elemento video invisible para mantener activo el decodificador de medios de WebKit
      const video = document.createElement('video');
      video.setAttribute('title', 'FenixFrame Wake Lock Keep');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.loop = true;
      video.setAttribute('aria-hidden', 'true');
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0.001';
      video.style.pointerEvents = 'none';

      if (this.fallbackCanvas && typeof this.fallbackCanvas.captureStream === 'function') {
        try {
          const stream = this.fallbackCanvas.captureStream(2);
          video.srcObject = stream;
        } catch (streamErr) {
          console.warn('[WebWakeLock] captureStream fallo, usando source base64:', streamErr);
          video.src = SILENT_WEBM_DATA_URI;
        }
      } else {
        video.src = SILENT_WEBM_DATA_URI;
      }

      document.body.appendChild(video);
      this.fallbackVideo = video;
      video.play().catch((playErr) => {
        console.warn('[WebWakeLock] Autoplay de video postergado a interaccion de usuario:', playErr);
      });

      // Heartbeat redundante para reactivar reproduccion si WebKit la pausa en segundo plano
      if (!this.heartbeatTimer) {
        this.heartbeatTimer = setInterval(() => {
          if (this.isActive && this.fallbackVideo && this.fallbackVideo.paused) {
            this.fallbackVideo.play().catch(() => {});
          }
        }, 15000);
      }
    } catch (e) {
      console.warn('[WebWakeLock] Error iniciando video canvas fallback:', e);
    }
  }

  _stopFallbackVideo() {
    if (this.canvasTimer) {
      clearInterval(this.canvasTimer);
      this.canvasTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.fallbackVideo) {
      try {
        this.fallbackVideo.pause();
        this.fallbackVideo.srcObject = null;
        this.fallbackVideo.src = '';
        if (this.fallbackVideo.parentNode) {
          this.fallbackVideo.parentNode.removeChild(this.fallbackVideo);
        }
      } catch (_) {}
      this.fallbackVideo = null;
    }
    this.fallbackCanvas = null;
  }

  async disable() {
    this.isActive = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (err) {
        console.warn('[WebWakeLock] Error liberando Screen Wake Lock:', err);
      }
      this.sentinel = null;
    }
    this._stopFallbackVideo();
  }
}

