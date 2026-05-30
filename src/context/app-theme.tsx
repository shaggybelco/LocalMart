import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  toggle: () => void;
}

const STORAGE_KEY = '@localmart_theme';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  resolved: 'light',
  toggle: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const system = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setMode(v);
    });
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? system : mode;

  const toggle = () => {
    const next: ThemeMode = resolved === 'light' ? 'dark' : 'light';
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolved, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
