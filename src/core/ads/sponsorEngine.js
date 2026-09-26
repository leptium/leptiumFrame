import { QRCode } from './qrGenerator.js';
import { i18n } from '../i18n/index.js';

// Catálogo curado de productos de diseño y accesorios de alta conversión para hogares y tablets
const SPONSOR_PRODUCTS = [
  {
    id: 'ipad-wood-stand',
    title: {
      es: 'Soporte de Madera Nogal para iPad y Tablets',
      en: 'Walnut Wood Desktop Stand for iPad & Tablets',
      fr: 'Support en Bois de Noyer pour iPad et Tablettes'
    },
    description: {
      es: 'El complemento ideal para transformar tu dispositivo en un marco de lujo sobre tu escritorio o velador.',
      en: 'The perfect artisanal companion to elevate your tablet into a luxury ambient photo frame.',
      fr: 'Le compagnon artisanal parfait pour transformer votre tablette en cadre de luxe sur votre bureau.'
    },
    tag: {
      es: 'Diseño Artesanal',
      en: 'Artisan Woodcraft',
      fr: 'Design Artisanal'
    },
    price: '$24.99',
    store: 'Amazon Choice',
    url: 'https://amazon.com/dp/B08XWN4M?tag=leptiumframe-20'
  },
  {
    id: 'magnetic-wall-mount',
    title: {
      es: 'Montaje Magnético de Pared Ultra Delgado',
      en: 'Ultra-Slim Magnetic Wall Mount for Smart Displays',
      fr: 'Support Mural Magnétique Ultra-Fin pour Tablettes'
    },
    description: {
      es: 'Cuelga tu tablet en la pared del pasillo o la cocina como si fuera un cuadro de galería sin cables a la vista.',
      en: 'Mount your tablet flush to any wall in hallways or kitchens like a true museum art piece.',
      fr: 'Fixez votre tablette au mur du couloir ou de la cuisine comme un véritable tableau de musée.'
    },
    tag: {
      es: 'Minimalismo 24/7',
      en: 'Clean Aesthetic',
      fr: 'Esthétique Épurée'
    },
    price: '$19.95',
    store: 'Amazon Prime',
    url: 'https://amazon.com/dp/B09ZMK8L?tag=leptiumframe-20'
  },
  {
    id: 'ambient-warm-light',
    title: {
      es: 'Luz Cálida LED Indirecta para Marcos y Repisas',
      en: 'Warm Ambient Backlight Strip for Picture Frames',
      fr: 'Bandeau LED Ambiance Chaleureuse pour Cadres'
    },
    description: {
      es: 'Iluminación suave indirecta de 2700K para realzar el contorno de tu pantalla en la oscuridad de la noche.',
      en: 'Soft 2700K indirect glow to illuminate the perimeter of your digital frame at night without glare.',
      fr: 'Éclairage doux indirect de 2700K pour mettre en valeur le contour de votre cadre la nuit.'
    },
    tag: {
      es: 'Ambiente Acogedor',
      en: 'Cozy Atmosphere',
      fr: 'Ambiance Cosy'
    },
    price: '$14.99',
    store: 'Top Seller',
    url: 'https://amazon.com/dp/B07Y7L2Q?tag=leptiumframe-20'
  }
];

export class SponsorEngine {
  constructor() {
    this.currentIndex = 0;
    this.photoCounter = 0;
    this.adInterval = 15; // Muestra un patrocinio cada 15 fotos en la versión Free
    this.activeTier = 'free'; // 'free', 'basic', 'premium', 'maker'
  }

  setTier(tier) {
    this.activeTier = tier;
  }

  getTier() {
    return this.activeTier;
  }

  isAdSupported() {
    return this.activeTier === 'free';
  }

  incrementPhotoCount() {
    this.photoCounter++;
  }

  shouldShowAd() {
    if (!this.isAdSupported()) return false;
    if (this.photoCounter >= this.adInterval) {
      this.photoCounter = 0;
      return true;
    }
    return false;
  }

  getNextAd() {
    const product = SPONSOR_PRODUCTS[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % SPONSOR_PRODUCTS.length;
    return product;
  }

  /**
   * Renderiza el HTML de la tarjeta de patrocinio interactiva con su código QR SVG
   */
  renderAdModalHTML(product) {
    const lang = i18n.getLanguage() || 'es';
    const title = product.title[lang] || product.title.es;
    const desc = product.description[lang] || product.description.es;
    const tag = product.tag[lang] || product.tag.es;

    // Generar código QR dinámico de alta fidelidad apuntando al enlace de afiliado
    const qrSvg = QRCode.generateSVG(product.url, 160, '#ffffff', 'transparent');

    return `
      <div id="sponsorCard" class="glass-card sponsor-card-wrapper animate-fade-in" onclick="event.stopPropagation()">
        <div class="sponsor-header">
          <div class="sponsor-badge-tag">
            <span class="sponsor-dot"></span>
            <span>${i18n.t('ads.sponsoredBadge')}</span>
          </div>
          <span class="sponsor-category">${tag}</span>
        </div>

        <div class="sponsor-body">
          <div class="sponsor-info">
            <h3 class="sponsor-title">${title}</h3>
            <p class="sponsor-desc">${desc}</p>
            <div class="sponsor-meta">
              <span class="sponsor-price">${product.price}</span>
              <span class="sponsor-store-badge">${product.store}</span>
            </div>
          </div>

          <div class="sponsor-qr-box">
            <div class="qr-container">
              ${qrSvg}
            </div>
            <p class="qr-prompt">${i18n.t('ads.scanPrompt')}</p>
          </div>
        </div>

        <div class="sponsor-footer">
          <span class="sponsor-dismiss-hint">${i18n.t('ads.tapToClose')}</span>
          <button class="btn-sponsor-close" onclick="window.closeSponsorCard && window.closeSponsorCard()">
            ${i18n.t('app.close')}
          </button>
        </div>

        <div class="sf-ad-countdown-track">
          <div class="sf-ad-countdown-fill"></div>
        </div>
      </div>
    `.trim();
  }
}

export const sponsorEngine = new SponsorEngine();
