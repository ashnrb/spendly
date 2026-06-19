import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

const CURRENCIES = { AUD: '$', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

export function SettingsProvider({ children }) {
  const [name, setName] = useState('');
  const [defaultPeriod, setDefaultPeriod] = useState('weekly');
  const [currency, setCurrency] = useState('AUD');
  const [loaded, setLoaded] = useState(false);

  // Theme stays in localStorage — applied instantly on load, no flash
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load DB-backed settings once
  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || '');
        setDefaultPeriod(data.default_period || 'weekly');
        setCurrency(data.currency || 'AUD');
        setLoaded(true);
      })
      .catch((err) => { console.error('Error loading settings:', err); setLoaded(true); });
  }, []);

  function saveSettings(next) {
    const payload = {
      name: next.name ?? name,
      default_period: next.defaultPeriod ?? defaultPeriod,
      currency: next.currency ?? currency,
    };
    setName(payload.name);
    setDefaultPeriod(payload.default_period);
    setCurrency(payload.currency);
    return fetch('http://localhost:5000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('Error saving settings:', err));
  }

  function toggleTheme() { setTheme((t) => (t === 'light' ? 'dark' : 'light')); }

  const symbol = CURRENCIES[currency] || '$';
  function formatMoney(value) { return `${symbol}${(parseFloat(value) || 0).toFixed(2)}`; }

  const value = {
    name, defaultPeriod, currency, theme, loaded, symbol, formatMoney,
    saveSettings, toggleTheme, currencyOptions: Object.keys(CURRENCIES),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}