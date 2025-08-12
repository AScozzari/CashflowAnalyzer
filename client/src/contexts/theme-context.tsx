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
    const stored = localStorage.getItem("easycashflow-theme");
    return (stored as Theme) || "system";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    
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
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("easycashflow-theme", theme);
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