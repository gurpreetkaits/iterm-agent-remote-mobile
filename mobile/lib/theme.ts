export type ThemeMode = "light" | "dark" | "auto";

export interface ThemeColors {
  bg: string;
  bgElev: string;
  bgElev2: string;
  border: string;
  borderStrong: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  accent: string;
  green: string;
  amber: string;
  red: string;
  // Terminal stays dark in both modes for ANSI fidelity
  termBg: string;
  termFg: string;
}

export const lightColors: ThemeColors = {
  bg: "#ffffff",
  bgElev: "#fafafa",
  bgElev2: "#f4f4f5",
  border: "#eaeaea",
  borderStrong: "#d4d4d8",
  fg: "#000000",
  fgMuted: "#71717a",
  fgSubtle: "#a1a1aa",
  accent: "#0070f3",
  green: "#00a656",
  amber: "#f5a623",
  red: "#ee0000",
  termBg: "#0a0a0a",
  termFg: "#e6edf3",
};

export const darkColors: ThemeColors = {
  bg: "#000000",
  bgElev: "#0a0a0a",
  bgElev2: "#111111",
  border: "#1f1f1f",
  borderStrong: "#2e2e2e",
  fg: "#ffffff",
  fgMuted: "#a1a1aa",
  fgSubtle: "#71717a",
  accent: "#3291ff",
  green: "#50e3c2",
  amber: "#f5a623",
  red: "#ee5050",
  termBg: "#000000",
  termFg: "#e6edf3",
};

export const tokens = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  fontSize: { xs: 10, sm: 11, base: 13, md: 14, lg: 16, xl: 22, hero: 28 },
} as const;

