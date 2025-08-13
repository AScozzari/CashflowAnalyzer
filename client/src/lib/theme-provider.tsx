import React, { createContext, useContext, ReactNode } from "react";

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
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "easycashflow-ui-theme",
  ...props
}: ThemeProviderProps) {
  console.log('[THEME] Simplified ThemeProvider - no hooks, static theme');
  
  // SIMPLIFIED: No useState hooks, just static theme
  const currentTheme = defaultTheme;
  
  // Apply theme immediately to document without useEffect
  React.useLayoutEffect(() => {
    if (typeof window !== "undefined" && window.document) {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(currentTheme);
      console.log('[THEME] Applied theme:', currentTheme);
    }
  });

  const value = {
    theme: currentTheme,
    setTheme: (newTheme: Theme) => {
      console.log('[THEME] Theme change requested:', newTheme);
      // Apply directly to DOM without state management
      if (typeof window !== "undefined" && window.document) {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <div className={currentTheme}>
        {children}
      </div>
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};