import i18n from '../i18n/i18n';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'tr'];

// Country code to language mapping
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // English-speaking countries
  US: 'en',
  GB: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  
  // Spanish-speaking countries
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  
  // French-speaking countries
  FR: 'fr',
  BE: 'fr',
  CH: 'fr',
  CA_FR: 'fr', // Special case for French Canada
  
  // Turkish-speaking countries
  TR: 'tr',
  CY: 'tr', // Northern Cyprus
};

/**
 * Get the user's preferred language from localStorage
 * @returns The stored language code or null if not found
 */
export const getStoredLanguage = (): string | null => {
  return localStorage.getItem('preferredLanguage');
};

/**
 * Store the user's preferred language in localStorage
 * @param language The language code to store
 */
export const storeLanguage = (language: string): void => {
  localStorage.setItem('preferredLanguage', language);
};

/**
 * Get the user's browser language
 * @returns The browser language code
 */
export const getBrowserLanguage = (): string => {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0];
  
  return SUPPORTED_LANGUAGES.includes(langCode) ? langCode : 'en';
};

/**
 * Detect the user's country based on IP geolocation
 * @returns Promise resolving to a country code
 */
export const detectCountry = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.error('Error detecting country:', error);
    return '';
  }
};

/**
 * Get language based on country code
 * @param countryCode The country code
 * @returns The corresponding language code or default language
 */
export const getLanguageFromCountry = (countryCode: string): string => {
  // Special case for Canada - check if browser language is French
  if (countryCode === 'CA' && navigator.language.startsWith('fr')) {
    return 'fr';
  }
  
  return COUNTRY_TO_LANGUAGE[countryCode] || 'en';
};

/**
 * Initialize language detection and set the appropriate language
 */
export const initializeLanguageDetection = async (): Promise<void> => {
  // First check if user has a stored preference
  const storedLang = getStoredLanguage();
  if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
    i18n.changeLanguage(storedLang);
    return;
  }
  
  // Then check browser language
  const browserLang = getBrowserLanguage();
  if (SUPPORTED_LANGUAGES.includes(browserLang)) {
    i18n.changeLanguage(browserLang);
    storeLanguage(browserLang);
    return;
  }
  
  // Finally try geolocation-based detection
  try {
    const countryCode = await detectCountry();
    if (countryCode) {
      const geoLang = getLanguageFromCountry(countryCode);
      i18n.changeLanguage(geoLang);
      storeLanguage(geoLang);
    }
  } catch (error) {
    console.error('Error in language detection:', error);
    // Fall back to default language
    i18n.changeLanguage('en');
    storeLanguage('en');
  }
};

/**
 * Check if the current language is RTL
 * @returns Boolean indicating if the current language is RTL
 */
export const isRTL = (): boolean => {
  // Currently we don't have RTL languages, but this will be useful if added
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(i18n.language);
};

/**
 * Get the current language's text direction
 * @returns 'rtl' or 'ltr'
 */
export const getTextDirection = (): 'rtl' | 'ltr' => {
  return isRTL() ? 'rtl' : 'ltr';
};

export default {
  initializeLanguageDetection,
  getStoredLanguage,
  storeLanguage,
  getBrowserLanguage,
  detectCountry,
  getLanguageFromCountry,
  isRTL,
  getTextDirection,
  SUPPORTED_LANGUAGES,
};
