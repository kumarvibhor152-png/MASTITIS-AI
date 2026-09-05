import { useTranslation } from 'react-i18next';

export const COW_NAMES_MAP = {
  Lakshmi: {
    en: 'Lakshmi',
    hi: 'लक्ष्मी',
    mr: 'लक्ष्मी',
    pa: 'ਲਕਸ਼ਮੀ',
    gu: 'લક્ષ્મી',
    ta: 'லக்ஷ்மி',
    te: 'లక్ష్మి',
    bn: 'লক্ষ্মী',
    kn: 'ಲಕ್ಷ್ಮಿ',
    or: 'ଲକ୍ଷ୍ମୀ',
  },
  Kamdhenu: {
    en: 'Kamdhenu',
    hi: 'कामधेनु',
    mr: 'कामधेनू',
    pa: 'ਕਾਮਧੇਨੂ',
    gu: 'કામધેનુ',
    ta: 'காமதேனு',
    te: 'కామధేనువు',
    bn: 'কামধেনু',
    kn: 'ಕಾಮಧೇನು',
    or: 'କାମଧେନୁ',
  },
  Ganga: {
    en: 'Ganga',
    hi: 'गंगा',
    mr: 'गंगा',
    pa: 'ਗੰਗਾ',
    gu: 'ગંગા',
    ta: 'கங்கா',
    te: 'గంగ',
    bn: 'গঙ্গা',
    kn: 'ಗಂಗಾ',
    or: 'ଗଙ୍ଗା',
  },
  Saraswati: {
    en: 'Saraswati',
    hi: 'सरस्वती',
    mr: 'सरस्वती',
    pa: 'ਸਰਸਵਤੀ',
    gu: 'સરસ્વતી',
    ta: 'சரஸ்வதி',
    te: 'సరస్వతి',
    bn: 'সরস্বতী',
    kn: 'ಸರಸ್ವತಿ',
    or: 'ସରସ୍ୱତୀ',
  },
  Durga: {
    en: 'Durga',
    hi: 'दुर्गा',
    mr: 'दुर्गा',
    pa: 'ਦੁਰਗਾ',
    gu: 'દુર્ગા',
    ta: 'துர்கா',
    te: 'దుర్గ',
    bn: 'দুর্গা',
    kn: 'ದುರ್ಗಾ',
    or: 'ଦୁର୍ଗା',
  },
  Parvati: {
    en: 'Parvati',
    hi: 'पार्वती',
    mr: 'पार्वती',
    pa: 'ਪਾਰਵਤੀ',
    gu: 'પાર્વતી',
    ta: 'பார்வதி',
    te: 'పార్వతి',
    bn: 'পার্বতী',
    kn: 'ಪಾರ್ವತಿ',
    or: 'ପାର୍ବତୀ',
  },
  Meera: {
    en: 'Meera',
    hi: 'मीरा',
    mr: 'मीरा',
    pa: 'ਮੀਰਾ',
    gu: 'મીરા',
    ta: 'மீரா',
    te: 'మీరా',
    bn: 'মীরা',
    kn: 'ಮೀರಾ',
    or: 'ମୀରା',
  },
  Radha: {
    en: 'Radha',
    hi: 'राधा',
    mr: 'राधा',
    pa: 'ਰਾਧਾ',
    gu: 'રાધા',
    ta: 'ராதா',
    te: 'రాధ',
    bn: 'রাধা',
    kn: 'ರಾಧಾ',
    or: 'ରାଧା',
  },
  Gauri: {
    en: 'Gauri',
    hi: 'गौरी',
    mr: 'गौरी',
    pa: 'ਗੌਰੀ',
    gu: 'ગૌરી',
    ta: 'கௌரி',
    te: 'గౌరి',
    bn: 'গৌরী',
    kn: 'ಗೌರಿ',
    or: 'ଗୌରୀ',
  },
  Nandi: {
    en: 'Nandi',
    hi: 'नंदी',
    mr: 'नंदी',
    pa: 'ਨੰਦੀ',
    gu: 'નંદી',
    ta: 'நந்தி',
    te: 'నంది',
    bn: 'নন্দী',
    kn: 'ನಂದಿ',
    or: 'ନନ୍ଦୀ',
  },
  Nandini: {
    en: 'Nandini',
    hi: 'नंदिनी',
    mr: 'नंदिनी',
    pa: 'ਨੰਦਿਨੀ',
    gu: 'નંદિની',
    ta: 'நந்தினி',
    te: 'నందిని',
    bn: 'নন্দিনী',
    kn: 'ನಂದಿನಿ',
    or: 'ନନ୍ଦିନୀ',
  },
  Shyama: {
    en: 'Shyama',
    hi: 'श्यामा',
    mr: 'श्यामा',
    pa: 'ਸ਼ਿਆਮਾ',
    gu: 'શ્યામા',
    ta: 'ஷ்யாமா',
    te: 'శ్యామ',
    bn: 'শ্যামা',
    kn: 'ಶ್ಯಾಮಾ',
    or: 'ଶ୍ୟାମା',
  },
  Tulsi: {
    en: 'Tulsi',
    hi: 'तुलसी',
    mr: 'तुळशी',
    pa: 'ਤੁਲਸੀ',
    gu: 'તુલસી',
    ta: 'துளசி',
    te: 'తులసి',
    bn: 'তুলসী',
    kn: 'ತುಳಸಿ',
    or: 'ତୁଳସୀ',
  },
  Kaveri: {
    en: 'Kaveri',
    hi: 'कावेरी',
    mr: 'कावेरी',
    pa: 'ਕਾਵੇਰੀ',
    gu: 'કાવેરી',
    ta: 'காவேரி',
    te: 'కావేరి',
    bn: 'কাবেরী',
    kn: 'ಕಾವೇರಿ',
    or: 'କାବେରୀ',
  },
  Yamuna: {
    en: 'Yamuna',
    hi: 'यमुना',
    mr: 'यमुना',
    pa: 'ਯਮੁਨਾ',
    gu: 'યમુના',
    ta: 'யமுனை',
    te: 'యమున',
    bn: 'যমুনা',
    kn: 'ಯಮುನಾ',
    or: 'ଯମୁନା',
  },
  Gita: {
    en: 'Gita',
    hi: 'गीता',
    mr: 'गीता',
    pa: 'ਗੀਤਾ',
    gu: 'ગીਤਾ',
    ta: 'கீதா',
    te: 'గీత',
    bn: 'গীতা',
    kn: 'ಗೀತಾ',
    or: 'ଗୀତା',
  },
  Geeta: {
    en: 'Geeta',
    hi: 'गीता',
    mr: 'गीता',
    pa: 'ਗੀਤਾ',
    gu: 'ગીਤਾ',
    ta: 'கீதா',
    te: 'గీత',
    bn: 'গীতা',
    kn: 'ಗೀತಾ',
    or: 'ଗୀତା',
  },
  Surabhi: {
    en: 'Surabhi',
    hi: 'सुरभि',
    mr: 'सुरभी',
    pa: 'ਸੁਰਭੀ',
    gu: 'સુરભિ',
    ta: 'சுரபி',
    te: 'సురభి',
    bn: 'সুরভী',
    kn: 'ಸುರಭಿ',
    or: 'ସୁରଭି',
  },
  Kapila: {
    en: 'Kapila',
    hi: 'कपिला',
    mr: 'कपिला',
    pa: 'ਕਪਿਲਾ',
    gu: 'કપિલા',
    ta: 'கபிலா',
    te: 'కపిల',
    bn: 'কপিলা',
    kn: 'ಕಪಿಲಾ',
    or: 'କପିଳା',
  },
};

/**
 * Returns the localized name of a cow based on the given language code.
 * Falls back to the original name if no translation exists.
 */
export function getCowName(name, langCode = 'en') {
  if (!name) return '';
  const trimmed = typeof name === 'string' ? name.trim() : String(name);
  const lang = (langCode || 'en').split('-')[0].toLowerCase();
  
  // Check exact match
  if (COW_NAMES_MAP[trimmed] && COW_NAMES_MAP[trimmed][lang]) {
    return COW_NAMES_MAP[trimmed][lang];
  }

  // Check case-insensitive match
  const matchKey = Object.keys(COW_NAMES_MAP).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchKey && COW_NAMES_MAP[matchKey][lang]) {
    return COW_NAMES_MAP[matchKey][lang];
  }

  return name;
}

/**
 * React hook that returns a function to translate cow names
 * according to the currently active i18n language.
 */
export function useCowName() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  return (name) => getCowName(name, currentLang);
}
