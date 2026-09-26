/**
 * Configuración central de Pasarela de Pagos (Lemon Squeezy)
 * 
 * Para conectar tu tienda real de Lemon Squeezy:
 * 1. Crea tus productos en el panel de Lemon Squeezy (Básico, Premium Pro, Maker)
 * 2. En cada producto, activa "Generate License Keys"
 * 3. Reemplaza las URLs de abajo con tus enlaces de checkout (o define window.LEMON_CONFIG)
 */

export const LEMON_CONFIG = {
  storeUrl: 'https://leptiumframe.lemonsqueezy.com',
  checkouts: {
    basic: 'https://leptiumframe.lemonsqueezy.com/buy/basic?embed=1',
    pro: 'https://leptiumframe.lemonsqueezy.com/buy/pro?embed=1',
    maker: 'https://leptiumframe.lemonsqueezy.com/buy/maker?embed=1'
  }
};

export function getCheckoutUrl(tier = 'pro') {
  if (typeof window !== 'undefined' && window.LEMON_CONFIG?.checkouts?.[tier]) {
    return window.LEMON_CONFIG.checkouts[tier];
  }
  return LEMON_CONFIG.checkouts[tier] || LEMON_CONFIG.checkouts.pro;
}
