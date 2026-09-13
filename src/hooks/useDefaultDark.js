import { useState } from 'react';
import { useDarkMode } from './useDarkMode';

export function useDefaultDark() {
  const [darkMode, toggleTheme] = useDarkMode();
  const [hasPreference, setHasPreference] = useState(() => localStorage.getItem('selora-theme') !== null);
  const forceDark = !hasPreference && !darkMode;

  const toggle = () => {
    if (forceDark) {
      localStorage.setItem('selora-theme', 'light');
    } else {
      toggleTheme();
    }
    setHasPreference(true);
  };

  return [darkMode || forceDark, toggle, forceDark];
}
