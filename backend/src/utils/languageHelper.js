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