import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { TranslationDictionary } from '../i18n/translations';

interface PWAInstallButtonProps {
  t: TranslationDictionary;
}

export function PWAInstallButton({ t }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-4 text-sm font-semibold text-[#15663C] transition-colors hover:bg-[#DFEDE5] whitespace-nowrap"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t.profile.pwaInstallCta}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4DAD2] bg-white px-4 text-sm font-semibold text-[#141A15] hover:bg-[#F6F7F5] whitespace-nowrap"
        >
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.profile.pwaInstallIOS}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#E5E7E4] bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3
                  id="ios-pwa-title"
                  className="font-display text-base font-bold text-[#141A15]"
                >
                  {t.profile.pwaIOSModalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t.profile.pwaClose}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#566058] hover:bg-[#F2F4F1]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 space-y-2 text-sm text-[#4E5750]">
                <p>{t.profile.pwaIOSModalStep1}</p>
                <p>{t.profile.pwaIOSModalStep2}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[48px] w-full rounded-xl bg-[#15663C] text-sm font-semibold text-white hover:bg-[#105230]"
              >
                {t.profile.pwaClose}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
