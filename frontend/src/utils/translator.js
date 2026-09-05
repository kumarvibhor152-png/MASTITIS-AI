// Dynamic Web Translation Controller for MASTITIS AI
// Automatically translates all website text on the fly without hardcoding dictionary keys

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
];

/**
 * Retrieve active language stored in localStorage
 */
export function getStoredLanguage() {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('mastitrack_lang') || 'en';
}

/**
 * Set Google Translate cookie to trigger in-DOM translation
 */
export function setGoogleTranslateCookie(langCode) {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;

  if (!langCode || langCode === 'en') {
    // Clear translate cookie to restore English
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `googtrans=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `googtrans=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = 'googtrans=/en/en; path=/;';
    document.cookie = `googtrans=/en/en; path=/; domain=${host};`;
  } else {
    const val = `/en/${langCode}`;
    document.cookie = `googtrans=${val}; path=/;`;
    document.cookie = `googtrans=${val}; path=/; domain=${host};`;
    document.cookie = `googtrans=${val}; path=/; domain=.${host};`;
  }
}

/**
 * Programmatically trigger Google Translate select combo if mounted
 */
export function triggerGoogleTranslate(langCode) {
  if (typeof document === 'undefined') return false;
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

/**
 * Translate site into target language without hardcoding any word
 */
export function applyLanguage(langCode, options = { reload: true }) {
  if (typeof window === 'undefined') return;

  const targetLang = langCode || 'en';
  localStorage.setItem('mastitrack_lang', targetLang);
  setGoogleTranslateCookie(targetLang);

  // Notify custom listeners
  window.dispatchEvent(
    new CustomEvent('mastitrack:language-changed', {
      detail: { language: targetLang },
    })
  );

  // Trigger combo if available
  const triggered = triggerGoogleTranslate(targetLang);

  // Reload page to guarantee 100% full-DOM translation without lingering untranslated fragments
  if (options.reload) {
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }
}

// In-Memory & LocalStorage translation cache for dynamic text
const translationCache = new Map();

/**
 * Translate single text dynamically using neural translation endpoint (no hardcoding needed)
 */
export async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;
  const cacheKey = `${targetLang}:${text.trim()}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(`trans_${cacheKey}`);
    if (stored) {
      translationCache.set(cacheKey, stored);
      return stored;
    }
  } catch (e) {}

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (data && data[0]) {
      const translated = data[0].map((chunk) => chunk[0]).join('');
      translationCache.set(cacheKey, translated);
      try {
        localStorage.setItem(`trans_${cacheKey}`, translated);
      } catch (e) {}
      return translated;
    }
  } catch (err) {
    console.warn('Dynamic translate error:', err);
  }
  return text;
}
