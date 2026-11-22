import { useCallback, useEffect, useState } from 'react';
import {
  HTML_LANG_CODE,
  LANGUAGE_DIRECTION,
  TRANSLATIONS,
} from '../i18n/translations';
import {
  loadCachedLanguage,
  saveCachedLanguage,
} from '../services/firestoreService';
import type { Language } from '../types/grocery';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() =>
    loadCachedLanguage()
  );
  const direction = LANGUAGE_DIRECTION[language];
  const t = TRANSLATIONS[language];

  useEffect(() => {
    document.documentElement.lang = HTML_LANG_CODE[language];
    document.documentElement.dir = direction;
    document.title = t.brandName;
  }, [language, direction, t.brandName]);

  const setLanguage = useCallback((nextLang: Language) => {
    setLanguageState(nextLang);
    saveCachedLanguage(nextLang);
  }, []);

  return {
    language,
    direction,
    t,
    setLanguage,
  };
}
