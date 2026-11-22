import { useCallback, useEffect, useState } from 'react';
import {
  isIosSafariNonStandalone,
  sendMobileNotification,
} from '../utils/mobileNotifications';

const BROWSER_ALERTS_OPTIN_KEY = 'bazar_fresh_browser_alerts_optin_v1';

export type BrowserAlertStatus =
  | 'unsupported'
  | 'ios-install-required'
  | 'denied'
  | 'off'
  | 'enabled';

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function readOptInFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BROWSER_ALERTS_OPTIN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeOptInFlag(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BROWSER_ALERTS_OPTIN_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

function computeStatus(optedIn: boolean): BrowserAlertStatus {
  if (isIosSafariNonStandalone()) return 'ios-install-required';
  if (!isNotificationSupported()) return 'unsupported';
  const perm = Notification.permission;
  if (perm === 'denied') return 'denied';
  if (perm === 'granted' && optedIn) return 'enabled';
  return 'off';
}

export function useBrowserOrderAlerts() {
  const [optedIn, setOptedIn] = useState<boolean>(() => readOptInFlag());
  const [status, setStatus] = useState<BrowserAlertStatus>(() =>
    computeStatus(readOptInFlag())
  );

  // Sync status when returning to tab or toggling opt-in (never auto-prompts on load)
  useEffect(() => {
    const sync = () => setStatus(computeStatus(optedIn));
    sync();
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [optedIn]);

  // Must invoke Notification.requestPermission() directly inside user click gesture
  const toggleAlerts = useCallback(async () => {
    if (isIosSafariNonStandalone()) {
      setStatus('ios-install-required');
      return;
    }

    if (!isNotificationSupported()) {
      setStatus('unsupported');
      return;
    }

    if (status === 'enabled') {
      writeOptInFlag(false);
      setOptedIn(false);
      setStatus('off');
      return;
    }

    if (Notification.permission === 'granted') {
      writeOptInFlag(true);
      setOptedIn(true);
      setStatus('enabled');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        writeOptInFlag(true);
        setOptedIn(true);
        setStatus('enabled');
      } else if (result === 'denied') {
        writeOptInFlag(false);
        setOptedIn(false);
        setStatus('denied');
      } else {
        setStatus('off');
      }
    } catch {
      setStatus('off');
    }
  }, [status]);

  const sendBrowserNotification = useCallback(
    (title: string, body: string, tag?: string) => {
      if (!optedIn) return;
      void sendMobileNotification(title, body, tag);
    },
    [optedIn]
  );

  return {
    status,
    toggleAlerts,
    sendBrowserNotification,
  };
}
