/**
 * Universal App Badge Utility with Firefox / Cross-Browser Fallback
 * Supports:
 * 1. Native W3C Badging API (navigator.setAppBadge) for supported OS / Chrome / Edge
 * 2. Dynamic Canvas Favicon Badge for Firefox & browsers without native Badging API
 * 3. Document Title Counter: "(12) App Title"
 */

let originalTitle = document.title;
const ORIGINAL_FAVICON = '/favicon.svg';

/**
 * Set App Badge (Native + Dynamic Favicon + Tab Title for Firefox)
 */
export async function setAppBadge(count) {
  if (count <= 0) {
    return clearAppBadge();
  }

  // 1. Native Badging API (If supported by OS/browser)
  if ('setAppBadge' in navigator) {
    try {
      await navigator.setAppBadge(count);
    } catch (e) {
      // Ignore OS permission errors
    }
  }

  // 2. Document Title Badge Fallback (Works 100% in Firefox)
  if (!originalTitle) originalTitle = document.title;
  const cleanTitle = document.title.replace(/^\(\d+\+?\)\s*/, '');
  document.title = `(${count > 99 ? '99+' : count}) ${cleanTitle}`;

  // 3. Dynamic Favicon Badge Fallback (Works 100% in Firefox)
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/pwa-192x192.png';

    img.onload = () => {
      // Draw base icon
      ctx.drawImage(img, 0, 0, 32, 32);

      // Draw red badge bubble
      const text = count > 99 ? '99+' : String(count);
      const badgeRadius = text.length > 2 ? 10 : 8;
      const x = 32 - badgeRadius - 1;
      const y = badgeRadius + 1;

      ctx.beginPath();
      ctx.arc(x, y, badgeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444'; // Red
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw badge text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${text.length > 2 ? '8px' : '9px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 0.5);

      // Apply to link[rel="icon"]
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = canvas.toDataURL('image/png');
    };
  } catch (err) {
    console.warn('[Badge] Favicon badge rendering skipped:', err);
  }

  return { success: true, count, isNative: 'setAppBadge' in navigator };
}

/**
 * Clear App Badge (Restores Favicon & Document Title)
 */
export async function clearAppBadge() {
  // 1. Native Badging API
  if ('clearAppBadge' in navigator) {
    try {
      await navigator.clearAppBadge();
    } catch (e) {
      // Ignore
    }
  }

  // 2. Restore Document Title
  if (originalTitle) {
    document.title = document.title.replace(/^\(\d+\+?\)\s*/, '');
  }

  // 3. Restore Original Favicon
  const link = document.querySelector("link[rel*='icon']");
  if (link) {
    link.type = 'image/svg+xml';
    link.href = ORIGINAL_FAVICON;
  }

  return { success: true, cleared: true };
}
