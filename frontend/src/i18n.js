import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import pa from './locales/pa.json';
import gu from './locales/gu.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import bn from './locales/bn.json';
import kn from './locales/kn.json';
import or from './locales/or.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      pa: { translation: pa },
      gu: { translation: gu },
      ta: { translation: ta },
      te: { translation: te },
      bn: { translation: bn },
      kn: { translation: kn },
      or: { translation: or },
    },
    fallbackLng: 'en',
    lng: localStorage.getItem('mastitrack_lang') || 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mastitrack_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
