/**
 * Cross-platform Service Worker registration and mobile-safe notification helper
 * for Android Chrome, iOS Safari (standalone Home Screen PWA), and desktop browsers.
 */

export function isIosDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * Returns true when running on iOS Safari outside Home Screen standalone mode,
 * where Web Notifications require the user to add the app to their Home Screen first.
 */
export function isIosSafariNonStandalone(): boolean {
  return isIosDevice() && !isStandalonePwa();
}

export function registerAppServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const register = () => {
    try {
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // Non-fatal: app works smoothly even if SW registration is blocked in preview/private tabs
        });
    } catch {
      // Ignore unexpected browser restriction
    }
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

/**
 * Safely dispatches a mobile/desktop system notification.
 * - Always checks Notification support & 'granted' permission first.
 * - Prefers ServiceWorkerRegistration.showNotification(...) for Android & iOS PWA compatibility.
 * - Falls back to new Notification(...) only when no SW is available, always inside try/catch.
 * - Never throws, so a notification error can NEVER block the in-app Thank-You popup.
 */
export async function sendMobileNotification(
  title: string,
  body: string,
  tag?: string
): Promise<boolean> {
  try {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return false;
    }

    if ('serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) =>
            window.setTimeout(() => resolve(null), 2500)
          ),
        ]);

        if (reg && typeof reg.showNotification === 'function') {
          const options: NotificationOptions & { vibrate?: number[] } = {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag,
            vibrate: [150, 80, 150],
            data: { url: '/' },
          };
          await reg.showNotification(title, options);
          return true;
        }
      } catch {
        // Fall through to safe direct Notification fallback if SW showNotification fails
      }
    }

    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag,
      });
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
