"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Initialize from localStorage or default to dark
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else {
        setTheme("dark");
      }
    } catch {
      setTheme("dark");
    }
  }, []);

  // Apply to <html> class and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // ignore persistence errors
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Inline script to run before hydration and avoid flash. Default is dark.
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          "(function(){try{var t=localStorage.getItem('theme');var e=document.documentElement;if(t==='light'){e.classList.remove('dark')}else{e.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();",
      }}
    />
  );
}


