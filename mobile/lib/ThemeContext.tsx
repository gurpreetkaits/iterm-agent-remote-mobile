import React, { createContext, useContext, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";

import {
  darkColors,
  lightColors,
  ThemeColors,
  ThemeMode,
  tokens,
} from "./theme";
import { useStore } from "../store/useStore";

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "Courier",
})!;

const SANS = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
})!;

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  spacing: typeof tokens.spacing;
  radius: typeof tokens.radius;
  fontSize: typeof tokens.fontSize;
  fonts: { mono: string; sans: string };
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useStore((s) => s.themeMode);
  const setMode = useStore((s) => s.setThemeMode);
  const system = useColorScheme();

  const isDark = mode === "auto" ? system === "dark" : mode === "dark";

  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
      toggle: () => setMode(isDark ? "light" : "dark"),
      spacing: tokens.spacing,
      radius: tokens.radius,
      fontSize: tokens.fontSize,
      fonts: { mono: MONO, sans: SANS },
    }),
    [isDark, mode, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback to dark — should never happen if provider is mounted at root
    return {
      colors: darkColors,
      isDark: true,
      mode: "dark",
      setMode: () => {},
      toggle: () => {},
      spacing: tokens.spacing,
      radius: tokens.radius,
      fontSize: tokens.fontSize,
      fonts: { mono: MONO, sans: SANS },
    };
  }
  return ctx;
}
