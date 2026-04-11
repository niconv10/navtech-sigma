import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ThemeColor = "default" | "pink" | "claude";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colorTheme: ThemeColor;
  setColorTheme: (theme: ThemeColor) => void;
  resolvedMode: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sigma-mode") as ThemeMode) || "light";
    }
    return "light";
  });

  const [colorTheme, setColorThemeState] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sigma-color-theme") as ThemeColor) || "default";
    }
    return "default";
  });

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;

    const applyMode = (m: ThemeMode) => {
      let resolved: "light" | "dark" = "light";

      if (m === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        resolved = m;
      }

      setResolvedMode(resolved);

      root.classList.remove("dark");
      if (resolved === "dark") {
        root.classList.add("dark");
      }
    };

    applyMode(mode);
    localStorage.setItem("sigma-mode", mode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (mode === "system") {
        applyMode("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-default", "theme-pink", "theme-claude");
    
    // Add current theme class
    root.classList.add(`theme-${colorTheme}`);
    localStorage.setItem("sigma-color-theme", colorTheme);
  }, [colorTheme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setColorTheme = (newTheme: ThemeColor) => {
    setColorThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, colorTheme, setColorTheme, resolvedMode }}>
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
