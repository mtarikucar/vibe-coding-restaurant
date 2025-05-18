import { vi } from 'vitest';
import { 
  formatCurrency, 
  formatDate, 
  formatTimeAgo, 
  formatDateFns,
  formatNumber,
  formatPercentage,
  getCurrencySymbol,
  getCurrencyCode
} from '../utils/formatters';
import languageDetectionService from '../services/languageDetectionService';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn().mockReturnValue('Jan 1, 2023'),
  formatDistance: vi.fn().mockReturnValue('2 days ago'),
  formatRelative: vi.fn().mockReturnValue('yesterday at 2:30 PM'),
  isDate: vi.fn().mockImplementation((date) => date instanceof Date),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'en-US',
    userLanguage: 'en-US',
  },
  writable: true,
});

// Mock fetch for country detection
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({ country_code: 'US' }),
  })
) as any;

describe('Formatting Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset i18next language to English
    const i18n = require('i18next').default;
    i18n.language = 'en';
  });

  describe('Currency Formatting', () => {
    test('formats currency with default locale (en)', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    test('formats currency with Turkish locale', () => {
      const i18n = require('i18next').default;
      i18n.language = 'tr';
      
      const result = formatCurrency(1234.56);
      expect(result).toContain('₺');
    });

    test('returns empty string for invalid input', () => {
      const result = formatCurrency(NaN);
      expect(result).toBe('');
    });

    test('gets correct currency symbol based on locale', () => {
      const i18n = require('i18next').default;
      
      i18n.language = 'en';
      expect(getCurrencySymbol()).toBe('$');
      
      i18n.language = 'tr';
      expect(getCurrencySymbol()).toBe('₺');
      
      i18n.language = 'fr';
      expect(getCurrencySymbol()).toBe('€');
    });

    test('gets correct currency code based on locale', () => {
      const i18n = require('i18next').default;
      
      i18n.language = 'en';
      expect(getCurrencyCode()).toBe('USD');
      
      i18n.language = 'tr';
      expect(getCurrencyCode()).toBe('TRY');
      
      i18n.language = 'fr';
      expect(getCurrencyCode()).toBe('EUR');
    });
  });

  describe('Date Formatting', () => {
    const testDate = new Date('2023-01-01T12:00:00Z');
    
    test('formats date with default locale (en)', () => {
      const result = formatDate(testDate);
      expect(result).toContain('2023');
      expect(result).toContain('Jan');
    });

    test('formats date with different styles', () => {
      expect(formatDate(testDate, 'short')).not.toEqual(formatDate(testDate, 'long'));
      expect(formatDate(testDate, 'long')).toContain('12');  // Should include time
    });

    test('returns empty string for invalid input', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(new Date('invalid'))).toBe('');
    });

    test('uses date-fns for advanced formatting', () => {
      formatDateFns(testDate);
      const { format } = require('date-fns');
      expect(format).toHaveBeenCalled();
    });
  });

  describe('Number Formatting', () => {
    test('formats numbers according to locale', () => {
      const i18n = require('i18next').default;
      
      i18n.language = 'en';
      expect(formatNumber(1234.56)).toBe('1,234.56');
      
      i18n.language = 'fr';
      // In French locale, the thousand separator is a space and decimal is a comma
      const frResult = formatNumber(1234.56);
      expect(frResult).toMatch(/1.234,56|1 234,56/); // Different browsers might format slightly differently
    });

    test('formats percentages', () => {
      expect(formatPercentage(50)).toContain('%');
    });
  });
});

describe('Language Detection Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  test('gets browser language', () => {
    expect(languageDetectionService.getBrowserLanguage()).toBe('en');
    
    // Change navigator language to Turkish
    Object.defineProperty(window, 'navigator', {
      value: { language: 'tr-TR' },
      writable: true,
    });
    
    expect(languageDetectionService.getBrowserLanguage()).toBe('tr');
  });

  test('stores and retrieves language preference', () => {
    languageDetectionService.storeLanguage('fr');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('preferredLanguage', 'fr');
    expect(languageDetectionService.getStoredLanguage()).toBe('fr');
  });

  test('detects country and maps to language', async () => {
    const country = await languageDetectionService.detectCountry();
    expect(country).toBe('US');
    expect(languageDetectionService.getLanguageFromCountry('US')).toBe('en');
    expect(languageDetectionService.getLanguageFromCountry('TR')).toBe('tr');
    expect(languageDetectionService.getLanguageFromCountry('FR')).toBe('fr');
    expect(languageDetectionService.getLanguageFromCountry('ES')).toBe('es');
  });

  test('initializes language detection', async () => {
    const i18n = require('i18next').default;
    await languageDetectionService.initializeLanguageDetection();
    
    // Should default to browser language (en) when no stored preference
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
    
    // With stored preference
    localStorageMock.getItem.mockReturnValueOnce('tr');
    await languageDetectionService.initializeLanguageDetection();
    expect(i18n.changeLanguage).toHaveBeenCalledWith('tr');
  });
});
