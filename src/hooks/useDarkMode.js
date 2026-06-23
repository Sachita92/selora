import { useState, useLayoutEffect } from 'react';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const theme = localStorage.getItem('selora-theme');
    return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('selora-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  // useLayoutEffect fires synchronously before the browser paints, so the
  // .dark class is applied on the very first frame — no flash of light-mode
  // heading colours when navigating to a page with dark mode already active.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return [darkMode, toggleTheme];
}
