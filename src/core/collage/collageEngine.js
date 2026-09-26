import { QRCode } from '../ads/qrGenerator.js';

/**
 * Motor de generación y renderizado de collages fotográficos de alta fidelidad.
 * Diseñado con recolección agresiva de memoria para evitar colapsos de WebKit en 24/7.
 * Integra marcas de agua en cada cuadrante y código QR interactivo para viralidad orgánica.
 */
export class CollageEngine {
  constructor(canvasSize = 2048, gap = 18) {
    this.canvasSize = canvasSize;
    this.gap = gap;
  }

  /**
   * Genera un collage 2x2 a partir de 4 rutas o URIs de fotos.
   * @param {string[]} photoUrls - Array de exactamente 4 URLs (soporta blob:, data:, http)
   * @param {HTMLCanvasElement} [targetCanvas]
   * @param {string} [watermarkText] - Texto de publicidad cruzada (branding)
   * @param {string} [qrPromptText] - Texto de llamado a la acción para el QR (i18n)
   * @param {boolean} [showWatermark=true] - Si es false (Pro), genera un collage limpio de grado galería
   * @param {string} [currentLang='en'] - Idioma activo ('en' | 'es' | 'fr')
   * @returns {Promise<string>} Data URL en formato JPEG
   */
  async generate2x2(photoUrls, targetCanvas = null, watermarkText = '', qrPromptText = '', showWatermark = true, currentLang = 'en') {
    if (!photoUrls || photoUrls.length < 4) {
      throw new Error('Se requieren al menos 4 fotos para generar el collage.');
    }

    const canvas = targetCanvas || document.createElement('canvas');
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;
    const ctx = canvas.getContext('2d');

    // Espacio reservado para banner inferior de branding y código QR (280px con QR ampliado, 0px en versión Pro)
    const bannerHeight = showWatermark ? 280 : 0;
    const availableHeight = this.canvasSize - bannerHeight;

    const mitadW = (this.canvasSize - (this.gap * 3)) / 2;
    const mitadH = (availableHeight - (this.gap * 3)) / 2;

    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    const coords = [
      { x: this.gap, y: this.gap },
      { x: this.gap * 2 + mitadW, y: this.gap },
      { x: this.gap, y: this.gap * 2 + mitadH },
      { x: this.gap * 2 + mitadW, y: this.gap * 2 + mitadH }
    ];

    // Cargar las 4 imágenes en paralelo con limpieza garantizada
    const loadedImages = await Promise.all(
      photoUrls.slice(0, 4).map((src) => this._loadImage(src))
    );

    try {
      for (let i = 0; i < 4; i++) {
        const img = loadedImages[i];
        const coord = coords[i];

        const sWidth = img.naturalWidth || img.width;
        const sHeight = img.naturalHeight || img.height;
        let sX = 0;
        let sY = 0;
        let cropSize = sWidth;

        if (sWidth > sHeight) {
          sX = (sWidth - sHeight) / 2;
          cropSize = sHeight;
        } else {
          sY = (sHeight - sWidth) / 2;
          cropSize = sWidth;
        }

        // Dibujar foto cuadrada recortada en su cuadrante (100% limpia, sin marcas de agua superpuestas)
        ctx.drawImage(img, sX, sY, cropSize, cropSize, coord.x, coord.y, mitadW, mitadH);
      }

      // Dibujar Franja Inferior Exclusiva de Branding y Código QR Ampliado (solo si showWatermark es true)
      if (showWatermark) {
        renderCleanCollageFooter(ctx, this.canvasSize, this.canvasSize, currentLang);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      return dataUrl;
    } finally {
      // Liberación explícita de referencias de memoria en WebKit
      loadedImages.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = '';
        img.removeAttribute('src');
      });
      if (!targetCanvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
    }
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Blobs locales, Data URLs y activos del mismo origen no requieren crossOrigin
      if (src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/') || src.startsWith('assets/') || src.startsWith('./')) {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Fallo al cargar imagen local: ${src}`));
        img.src = src;
        return;
      }

      img.crossOrigin = 'anonymous';

      let finalSrc = src;
      if (src.startsWith('http') && !src.includes('cors_frame=')) {
        const sep = src.includes('?') ? '&' : '?';
        finalSrc = `${src}${sep}cors_frame=1`;
      }

      img.onload = () => resolve(img);
      img.onerror = () => {
        if (src.startsWith('http') && !src.includes('cors_ts=')) {
          const retry = new Image();
          retry.crossOrigin = 'anonymous';
          retry.onload = () => resolve(retry);
          retry.onerror = () => reject(new Error(`No se pudo cargar foto para el collage: ${src}`));
          const sep = src.includes('?') ? '&' : '?';
          retry.src = `${src}${sep}cors_ts=${Date.now()}`;
        } else {
          reject(new Error(`Fallo al cargar imagen: ${src}`));
        }
      };

      img.src = finalSrc;
    });
  }
}

/**
 * Selecciona 4 fotografías para el collage 2x2 garantizando la foto activa en el primer cuadrante
 * (superior izquierdo) y 3 fotografías aleatorias barajadas con Fisher-Yates sin duplicados.
 * @param {object|string} currentPhoto
 * @param {Array<object|string>} availablePhotos
 * @returns {Array<object|string>}
 */
export function getCollagePhotoSet(currentPhoto, availablePhotos) {
  const safeAvailable = Array.isArray(availablePhotos) ? availablePhotos : [];
  const getKey = (item) => {
    if (!item) return '';
    if (typeof item === 'object') {
      return String(item.id || item.src || item.ruta || '');
    }
    return String(item);
  };
  const currentKey = getKey(currentPhoto);

  // 1. Excluir la foto activa de la reserva de aleatorias
  const pool = safeAvailable.filter((p) => {
    if (!p) return false;
    if (typeof p === 'object' && p.hidden) return false;
    if (currentPhoto && typeof p === 'object' && typeof currentPhoto === 'object' && p.id !== undefined && currentPhoto.id !== undefined) {
      return p.id !== currentPhoto.id;
    }
    return getKey(p) !== currentKey;
  });

  // 2. Barajar la reserva (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 3. Tomar 3 imágenes aleatorias
  const selectedRandom = pool.slice(0, 3);

  // 4. Retornar el conjunto de 4 fotos (Actual + 3 aleatorias)
  const finalSet = currentPhoto ? [currentPhoto, ...selectedRandom] : [...selectedRandom];

  // Fallback si la colección tiene menos de 4 imágenes
  while (finalSet.length < 4 && safeAvailable.length > 0) {
    finalSet.push(safeAvailable[finalSet.length % safeAvailable.length]);
  }

  return finalSet;
}

// Variable canónica obligatoria para el QR
export const QR_TARGET_URL = 'https://leptiumframe.app';

/**
 * Asegura que la fuente de datos del código QR contenga explícitamente el protocolo https://
 * y renderiza la matriz QR sobre el lienzo si se provee contexto.
 * @param {string} [targetUrl=QR_TARGET_URL]
 * @param {CanvasRenderingContext2D|null} [ctx=null]
 * @param {number} [x=0]
 * @param {number} [y=0]
 * @param {number} [size=220]
 */
export function generateQRCode(targetUrl = QR_TARGET_URL, ctx = null, x = 0, y = 0, size = 220) {
  const raw = String(targetUrl || QR_TARGET_URL).trim();
  const canonicalUrl = /^https?:\/\//i.test(raw)
    ? raw.replace(/^http:\/\//i, 'https://')
    : `https://${raw}`;

  if (ctx) {
    QRCode.drawToCanvas(canonicalUrl, ctx, x, y, size, '#121212', '#FFFFFF');
  }
  return canonicalUrl;
}

/**
 * Renderiza el faldón inferior exclusivo del collage con tipografía dinámica multi-idioma (ES/EN/FR)
 * y código QR ampliado de alto contraste (220px + 12px de margen de silencio blanco = 244x244px).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {string} [currentLang='en']
 */
export function renderCleanCollageFooter(ctx, width, height, currentLang = 'en') {
  const footerHeight = 280;
  const footerY = height - footerHeight;

  // 1. Fondo del faldón inferior (Gris Carbón Profundo)
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, footerY, width, footerHeight);

  // 2. Diccionario Dinámico de Marca (i18n)
  const i18nFooter = {
    en: {
      title: 'leptium FenixFrame',
      tagline: 'The intelligent digital canvas',
      scan: 'Scan to get yours',
      price: '$9.99'
    },
    es: {
      title: 'leptium FenixFrame',
      tagline: 'El lienzo digital privado para tu hogar',
      scan: 'Escanea para activar el tuyo',
      price: '$9.99'
    },
    fr: {
      title: 'leptium FenixFrame',
      tagline: 'Le cadre numérique privé pour votre intérieur',
      scan: 'Scannez pour obtenir le vôtre',
      price: '9,99 $'
    }
  };

  const normalizedLang = String(currentLang || 'en').slice(0, 2).toLowerCase();
  const t = i18nFooter[normalizedLang] || i18nFooter.en;

  // 3. Textos de Marca (Alineados a la izquierda)
  const paddingX = 64;

  // Título Principal
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(t.title, paddingX, footerY + 60);

  // Subtítulo + URL + Precio
  ctx.fillStyle = '#A0A0A0';
  ctx.font = '400 30px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
  ctx.fillText(`${t.tagline} • leptiumframe.app • ${t.price}`, paddingX, footerY + 120);

  // 4. Código QR Ampliado y Marco de Alto Contraste (Alineado a la derecha)
  const qrSize = 220;
  const qrX = width - paddingX - qrSize;
  const qrY = footerY + (footerHeight - qrSize) / 2;

  // Zona de silencio blanca (Quiet Zone indispensable para cámaras de smartphone)
  const quietZone = 12;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    qrX - quietZone,
    qrY - quietZone,
    qrSize + (quietZone * 2),
    qrSize + (quietZone * 2)
  );

  // Al generar o dibujar la matriz QR con URL canónica HTTPS:
  generateQRCode(QR_TARGET_URL, ctx, qrX, qrY, qrSize);

  // Texto contextual junto al QR (Alineado a la derecha del código)
  ctx.fillStyle = '#E5E5E5';
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(t.scan, qrX - 24, footerY + (footerHeight / 2) - 8);
}

