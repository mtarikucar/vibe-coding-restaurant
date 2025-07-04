import i18next from"i18next";
import { format, formatDistance, formatRelative, isDate, type Locale } from"date-fns";
import { enUS, tr, es, fr } from"date-fns/locale";

// Map of locales for date-fns
const localeMap: Record<string, Locale> = {
 en: enUS,
 tr: tr,
 es: es,
 fr: fr,
};

// Get current locale for date-fns
const getLocale = (): Locale => {
 const language = i18next.language ||"en";
 return localeMap[language.split("-")[0]] || enUS;
};

// Currency symbols and codes by locale
const currencyConfig: Record<string, { symbol: string; code: string }> = {
 en: { symbol:"$", code: "USD" },
 tr: { symbol:"₺", code: "TRY" },
 es: { symbol:"€", code: "EUR" },
 fr: { symbol:"€", code: "EUR" },
};

// Get currency symbol based on locale
export const getCurrencySymbol = (): string => {
 const language = i18next.language ||"en";
 const langKey = language.split("-")[0];
 return currencyConfig[langKey]?.symbol ||"$";
};

// Get currency code based on locale
export const getCurrencyCode = (): string => {
 const language = i18next.language ||"en";
 const langKey = language.split("-")[0];
 return currencyConfig[langKey]?.code ||"USD";
};

/**
 * Format a number as currency according to the current locale
 * @param value - The number to format
 * @param currency - The currency code (if not provided, uses locale-based currency)
 * @returns Formatted currency string
 */
export const formatCurrency = (
 value: number | string,
 currency?: string
): string => {
 const numValue = typeof value ==="string" ? parseFloat(value) : value;
 if (isNaN(numValue)) return"";

 const language = i18next.language ||"en";
 const currencyCode = currency || getCurrencyCode();

 return new Intl.NumberFormat(language, {
  style:"currency",
  currency: currencyCode,
 }).format(numValue);
};

/**
 * Format a date according to the current locale
 * @param date - The date to format
 * @param formatStyle - The format style to use (default: 'short')
 * @returns Formatted date string
 */
export const formatDate = (
 date: Date | string,
 formatStyle:"short" | "medium" | "long" = "short"
): string => {
 if (!date) return"";

 const dateObj = typeof date ==="string" ? new Date(date) : date;
 if (isNaN(dateObj.getTime())) return"";

 const language = i18next.language ||"en";

 const options: Intl.DateTimeFormatOptions = {
  year:"numeric",
  month: formatStyle ==="short" ? "short" : "long",
  day:"numeric",
 };

 if (formatStyle ==="long") {
  options.hour ="numeric";
  options.minute ="numeric";
 }

 return new Intl.DateTimeFormat(language, options).format(dateObj);
};

/**
 * Format a date using date-fns with locale support
 * @param date - The date to format
 * @param formatStr - The format string (default: 'PP')
 * @returns Formatted date string
 */
export const formatDateFns = (
 date: Date | string | number,
 formatStr ="PP"
): string => {
 if (!date) return"";

 const dateObj = isDate(date) ? date : new Date(date);
 if (isNaN(dateObj.getTime())) return"";

 return format(dateObj, formatStr, { locale: getLocale() });
};

/**
 * Format a date as a relative time (e.g.,"5 minutes ago")
 * @param date - The date to format
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Formatted relative time string
 */
export const formatTimeAgo = (
 date: Date | string | number,
 baseDate: Date | string | number = new Date()
): string => {
 if (!date) return"";

 const dateObj = isDate(date) ? date : new Date(date);
 if (isNaN(dateObj.getTime())) return"";

 const baseDateObj = isDate(baseDate) ? baseDate : new Date(baseDate);

 return formatDistance(dateObj, baseDateObj, {
  addSuffix: true,
  locale: getLocale(),
 });
};

/**
 * Format a date relative to the current day (e.g.,"yesterday at 2:30 PM")
 * @param date - The date to format
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Formatted relative date string
 */
export const formatRelativeDate = (
 date: Date | string | number,
 baseDate: Date | string | number = new Date()
): string => {
 if (!date) return"";

 const dateObj = isDate(date) ? date : new Date(date);
 if (isNaN(dateObj.getTime())) return"";

 const baseDateObj = isDate(baseDate) ? baseDate : new Date(baseDate);

 return formatRelative(dateObj, baseDateObj, { locale: getLocale() });
};

/**
 * Format a number according to the current locale
 * @param num - Number to format
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export const formatNumber = (
 num: number,
 options: Intl.NumberFormatOptions = {}
): string => {
 if (num === null || num === undefined) return"";

 const language = i18next.language ||"en";

 return new Intl.NumberFormat(language, options).format(num);
};

/**
 * Format a percentage according to the current locale
 * @param value - Number to format as percentage
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted percentage string
 */
export const formatPercentage = (
 value: number,
 options: Intl.NumberFormatOptions = {}
): string => {
 if (value === null || value === undefined) return"";

 const language = i18next.language ||"en";

 return new Intl.NumberFormat(language, {
  style:"percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  ...options,
 }).format(value / 100);
};

/**
 * Format a date and time according to the current locale
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string): string => {
 if (!date) return"";

 const dateObj = typeof date ==="string" ? new Date(date) : date;
 if (isNaN(dateObj.getTime())) return"";

 const language = i18next.language ||"en";

 return new Intl.DateTimeFormat(language, {
  year:"numeric",
  month:"short",
  day:"numeric",
  hour:"numeric",
  minute:"numeric",
 }).format(dateObj);
};
