import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Safe localStorage access
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem("easycashflow-theme");
        return (stored as Theme) || "system";
      } catch (error) {
        console.warn('Could not access localStorage:', error);
      }
    }
    return "system";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== 'undefined') {
      if (theme === "system") {
        try {
          return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } catch (error) {
          console.warn('Could not access matchMedia:', error);
          return "light";
        }
      }
      return theme === "dark" ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !document.documentElement) return;
    
    const root = document.documentElement;
    
    try {
      if (theme === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const updateTheme = () => {
          const newTheme = mediaQuery.matches ? "dark" : "light";
          setActualTheme(newTheme);
          root.classList.toggle("dark", newTheme === "dark");
        };
        
        updateTheme();
        mediaQuery.addEventListener("change", updateTheme);
        return () => mediaQuery.removeEventListener("change", updateTheme);
      } else {
        const isDark = theme === "dark";
        setActualTheme(isDark ? "dark" : "light");
        root.classList.toggle("dark", isDark);
      }
    } catch (error) {
      console.warn('Theme update error:', error);
      // Fallback to light theme
      setActualTheme("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem("easycashflow-theme", theme);
      } catch (error) {
        console.warn('Could not save theme to localStorage:', error);
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}