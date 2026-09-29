/**
 * Detector determinista de perfil de hardware local y presupuesto de memoria.
 * Diferencia entornos iPadOS / iOS WebKit (Jetsam low-RAM) frente a Android y Desktop
 * para ajustar el ciclo de vida de ObjectURLs y el tamano de lote de importacion por goteo.
 */

export function detectHardwareProfile() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      osFamily: 'desktop',
      deviceProfile: 'desktop',
      tier: 'standard',
      isLowRam: false,
      isAppleWebKit: false,
      isIPadOS: false,
      isAndroid: false,
      deviceMemoryGB: 8,
      hardwareConcurrency: 4,
      maxActiveObjectUrls: 8,
      importBatchSize: 3,
      importYieldMs: 12,
      lazyBlobResolution: false,
      supportsFolderImport: true
    };
  }

  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = navigator.platform || '';
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches || maxTouchPoints > 0;
  const minDim = Math.min(window.innerWidth || 1024, window.innerHeight || 768);
  const maxDim = Math.max(window.innerWidth || 1024, window.innerHeight || 768);

  const isIPadOS =
    /ipad/i.test(ua) ||
    (platform === 'MacIntel' && maxTouchPoints > 1) ||
    (/macintosh/i.test(ua) && maxTouchPoints > 1);
  const isIOS = !isIPadOS && /iphone|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isTV = /smart-tv|tizen|webos|googletv|android tv|crkey|appletv/i.test(ua);
  const isAppleWebKit = isIPadOS || isIOS || (/applewebkit/i.test(ua) && !/chrome|chromium|crios|edg/i.test(ua));

  const reportedRam = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 4);

  // En iPadOS / iOS Safari, navigator.deviceMemory no se expone y WebKit impone un techo Jetsam estricto
  const effectiveRamGB = reportedRam > 0 ? reportedRam : (isIPadOS || isIOS ? 2 : 4);

  // Clasificar como low-ram en cualquier iPadOS/iOS o en dispositivos Android con <= 3 GB RAM o <= 4 nucleos
  const isLowRam = Boolean(
    isIPadOS ||
    isIOS ||
    effectiveRamGB <= 3 ||
    (isAndroid && cores <= 4 && effectiveRamGB <= 4)
  );

  let osFamily = 'desktop';
  if (isIPadOS) osFamily = 'ipados';
  else if (isIOS) osFamily = 'ios';
  else if (isAndroid) osFamily = 'android';
  else if (isTV) osFamily = 'tv';

  let deviceProfile = 'desktop';
  if (isTV || (!isTouch && maxDim >= 1920 && minDim >= 1080)) {
    deviceProfile = 'tv';
  } else if (isTouch && minDim < 600) {
    deviceProfile = 'phone';
  } else if (isTouch && minDim >= 600) {
    deviceProfile = 'legacy-tablet';
  }

  let supportsFolderImport = false;
  if (typeof document !== 'undefined') {
    const probeInput = document.createElement('input');
    supportsFolderImport = 'webkitdirectory' in probeInput || 'directory' in probeInput;
  }

  return {
    osFamily,
    deviceProfile,
    tier: isLowRam ? 'low-ram' : 'standard',
    isLowRam,
    isAppleWebKit,
    isIPadOS,
    isAndroid,
    deviceMemoryGB: effectiveRamGB,
    hardwareConcurrency: cores,
    maxActiveObjectUrls: isLowRam ? 2 : 8,
    importBatchSize: isLowRam ? 1 : 3,
    importYieldMs: isLowRam ? 28 : 10,
    lazyBlobResolution: true,
    supportsFolderImport
  };
}

export function applyHardwareProfileToDOM() {
  const profile = detectHardwareProfile();
  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    root.setAttribute('data-device-profile', profile.deviceProfile);
    root.setAttribute('data-os-family', profile.osFamily);
    root.setAttribute('data-hardware-tier', profile.tier);
    root.setAttribute(
      'data-input-mode',
      profile.deviceProfile === 'phone' || profile.deviceProfile === 'legacy-tablet' ? 'touch' : 'pointer'
    );
  }
  return profile;
}
