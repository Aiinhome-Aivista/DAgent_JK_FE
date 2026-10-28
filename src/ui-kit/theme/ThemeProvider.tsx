import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeType } from './colors';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('app-ui-theme');
    return (saved as ThemeType) || 'default';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('theme-default');
    localStorage.setItem('app-ui-theme', 'default');
  }, []);

  const toggleTheme = () => {
    // No-op as we only have one theme
  };

  const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
