import { useSettings } from "../context/SettingsContext";
import { useMemo } from "react";

export const useSettingsConsumer = () => {
  const { settings } = useSettings();

  // Theme utilities
  const theme = useMemo(() => ({
    isDark: settings?.theme === 'dark',
    isLight: settings?.theme === 'light',
    isAuto: settings?.theme === 'auto',
    currentTheme: settings?.theme || 'light'
  }), [settings?.theme]);

  // Language utilities
  const language = useMemo(() => ({
    current: settings?.language || 'en',
    isRTL: ['ar', 'he'].includes(settings?.language || 'en'),
    getText: (translations) => {
      return translations[settings?.language] || translations.en;
    }
  }), [settings?.language]);

  // Date formatting utility
  const formatDate = useMemo(() => (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const format = settings?.dateFormat || 'DD/MM/YYYY';
    const timeFormat = settings?.timeFormat || '12h';
    const timezone = settings?.timezone || 'Asia/Kolkata';
    
    // Apply timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: timeFormat === '12h' ? '2-digit' : '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12h',
      ...options
    });
    
    const parts = formatter.formatToParts(dateObj);
    const values = {};
    parts.forEach(part => values[part.type] = part.value);
    
    // Apply date format
    switch(format) {
      case 'MM/DD/YYYY':
        return `${values.month}/${values.day}/${values.year}`;
      case 'DD/MM/YYYY':
        return `${values.day}/${values.month}/${values.year}`;
      case 'YYYY-MM-DD':
        return `${values.year}-${values.month}-${values.day}`;
      default:
        return `${values.day}/${values.month}/${values.year}`;
    }
  }, [settings?.dateFormat, settings?.timeFormat, settings?.timezone]);

  // Time formatting utility
  const formatTime = useMemo(() => (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const timeFormat = settings?.timeFormat || '12h';
    const timezone = settings?.timezone || 'Asia/Kolkata';
    
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12h'
    }).format(dateObj);
  }, [settings?.timeFormat, settings?.timezone]);

  // Week start utility
  const weekStartsOn = useMemo(() => 
    settings?.weekStartsOn || 'monday'
  , [settings?.weekStartsOn]);

  return {
    theme,
    language,
    formatDate,
    formatTime,
    weekStartsOn,
    settings
  };
};