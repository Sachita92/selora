import { useState, useLayoutEffect } from 'react';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    // A stored choice wins; with nothing stored the app is dark. The boot
    // script in index.html applies the same rule before React loads, so the
    // two must agree or the first paint flickers.
    const theme = localStorage.getItem('selora-theme');
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return true;
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
