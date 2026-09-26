/**
 * HUD Toast System — leptium FenixFrame
 * Apple SF Glassmorphism floating notification system.
 * Replaces native browser alert() with frosted glass toasts and vector glyphs.
 * Strict zero-emoji compliance.
 */

export function showHudToast(message, type = 'info', duration = 3500) {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('sf-hud-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'sf-hud-toast';
  toast.className = `sf-hud-toast sf-hud-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  let iconColor = '#38bdf8'; // info cyan
  let iconSvg = '';

  if (type === 'success') {
    iconColor = '#30d158'; // Apple green
    iconSvg = `
      <svg class="sf-hud-glyph" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  } else if (type === 'error') {
    iconColor = '#ff453a'; // Apple red
    iconSvg = `
      <svg class="sf-hud-glyph" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
  } else if (type === 'warning') {
    iconColor = '#ffd60a'; // Apple yellow
    iconSvg = `
      <svg class="sf-hud-glyph" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  } else {
    // Default info
    iconColor = '#38bdf8';
    iconSvg = `
      <svg class="sf-hud-glyph" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }

  toast.innerHTML = `
    <div class="sf-hud-icon-wrap" style="color: ${iconColor};">
      ${iconSvg}
    </div>
    <span class="sf-hud-label">${message}</span>
  `;

  document.body.appendChild(toast);

  const timer = setTimeout(() => {
    toast.classList.add('sf-hud-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 350);
  }, duration);

  // Dismiss on click
  toast.onclick = () => {
    clearTimeout(timer);
    toast.classList.add('sf-hud-exit');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 250);
  };
}

if (typeof window !== 'undefined') {
  window.showHudToast = showHudToast;
}
