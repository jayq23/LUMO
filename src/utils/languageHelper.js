
// language helper functions
// use with useAuth hook to get language from preferences

export const languages = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  pt: 'Portuguese',
  tl: 'Tagalog'
};

export const getLanguageName = (code) => {
  return languages[code] || 'English';
};

export const getLanguageCode = (name) => {
  const entry = Object.entries(languages).find(([_, lang]) => lang === name);
  return entry ? entry[0] : 'en';
};

export const formatDate = (dateStr, language = 'en') => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (err) {
    console.error('Failed to format date:', err);
    return dateStr;
  }
};