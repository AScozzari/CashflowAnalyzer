import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

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
        return (stored as Theme) || "light";
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
        
        // Determine effective theme
        let effectiveTheme = theme;
        if (theme === "system") {
          effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        
        root.classList.toggle("dark", effectiveTheme === "dark");
        
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
    throw new Error("useSimpleTheme must be used within a SimpleThemeProvider");
  }
  return context;
}