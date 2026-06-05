import { createContext, useContext, useState, useEffect } from 'react';
import {
  loadTheme, saveTheme,
  loadLanguage, saveLanguage,
  loadRecentRecipes,
} from '../utils/storage';

const AppContext = createContext(null);

export const DARK = {
  bg: '#0F0F0F',
  card: '#1C1C1E',
  border: '#2C2C2E',
  text: '#FFFFFF',
  subtext: '#6B7280',
  muted: '#9CA3AF',
  accent: '#7C3AED',
  accentDim: '#3B0764',
};

export const LIGHT = {
  bg: '#F3F4F6',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  subtext: '#6B7280',
  muted: '#9CA3AF',
  accent: '#7C3AED',
  accentDim: '#EDE9FE',
};

export function AppProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState('en');
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([loadTheme(), loadLanguage(), loadRecentRecipes()]).then(
      ([theme, lang, recent]) => {
        if (theme) setIsDark(theme === 'dark');
        if (lang) setLanguage(lang);
        setRecentRecipes(recent);
        setReady(true);
      }
    );
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await saveTheme(next ? 'dark' : 'light');
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await saveLanguage(lang);
  };

  const refreshRecentRecipes = async () => {
    const recent = await loadRecentRecipes();
    setRecentRecipes(recent);
  };

  return (
    <AppContext.Provider
      value={{
        isDark,
        toggleTheme,
        language,
        changeLanguage,
        theme: isDark ? DARK : LIGHT,
        recentRecipes,
        refreshRecentRecipes,
        ready,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
