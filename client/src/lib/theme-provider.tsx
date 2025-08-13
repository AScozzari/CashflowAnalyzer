import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "easycashflow-ui-theme",
  ...props
}: ThemeProviderProps) {
  // CRITICAL FIX: Check React hooks BEFORE any useState call
  let theme: Theme;
  let setTheme: (theme: Theme) => void;
  
  try {
    // This is where the error was happening - useState called when React not ready
    const hookResult = useState<Theme>(() => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
        }
      } catch (error) {
        console.warn('localStorage not available:', error);
      }
      return defaultTheme;
    });
    
    theme = hookResult[0];
    setTheme = hookResult[1];
  } catch (error) {
    console.error('React hooks error in ThemeProvider:', error);
    // Fallback without hooks for initial load
    return (
      <div data-theme={defaultTheme} className={defaultTheme}>
        {children}
      </div>
    );
  }

  useEffect(() => {
    try {
      if (typeof window === "undefined" || !window.document) return;
      
      const root = window.document.documentElement;
      if (!root) return;

      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)")
          ?.matches
          ? "dark"
          : "light";

        root.classList.add(systemTheme);
        return;
      }

      root.classList.add(theme);
    } catch (error) {
      console.warn('Error applying theme:', error);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(storageKey, newTheme);
        }
        setTheme(newTheme);
      } catch (error) {
        console.warn('Error setting theme:', error);
        setTheme(newTheme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};