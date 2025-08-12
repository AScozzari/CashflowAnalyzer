import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface SimpleThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

export function SimpleThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem("easycashflow-theme");
        return (stored === "dark" ? "dark" : "light") as Theme;
      }
    } catch (error) {
      console.warn('Could not access localStorage:', error);
    }
    return "light";
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && document.documentElement) {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        
        if (window.localStorage) {
          localStorage.setItem("easycashflow-theme", theme);
        }
      }
    } catch (error) {
      console.warn('Theme update error:', error);
    }
  }, [theme]);

  return (
    <SimpleThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </SimpleThemeContext.Provider>
  );
}

export function useSimpleTheme() {
  const context = useContext(SimpleThemeContext);
  if (!context) {
    // Return default values instead of throwing
    return {
      theme: "light" as Theme,
      setTheme: () => {}
    };
  }
  return context;
}