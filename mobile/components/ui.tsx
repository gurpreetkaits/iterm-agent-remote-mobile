import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { useTheme } from "../lib/ThemeContext";

// ─── SectionLabel ────────────────────────────────────────────────────

export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 10,
          fontWeight: "500",
          color: t.colors.fgMuted,
          letterSpacing: 0.8,
          fontFamily: t.fonts.mono,
          marginBottom: 10,
          textTransform: "uppercase",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─── Card ────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.bg,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.md,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── CardRow ─────────────────────────────────────────────────────────

export function CardRow({
  children,
  onPress,
  last,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [
        {
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: t.colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backgroundColor: pressed ? t.colors.bgElev : "transparent",
        },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

// ─── Dot ─────────────────────────────────────────────────────────────

type DotTone = "green" | "amber" | "red" | "gray";

export function Dot({ tone = "gray", size = 8 }: { tone?: DotTone; size?: number }) {
  const t = useTheme();
  const map = {
    green: t.colors.green,
    amber: t.colors.amber,
    red: t.colors.red,
    gray: t.colors.fgSubtle,
  };
  const c = map[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c,
      }}
    />
  );
}

// ─── Badge (pill) ────────────────────────────────────────────────────

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "red";
}) {
  const t = useTheme();
  const toneColors: Record<string, { fg: string; border: string }> = {
    default: { fg: t.colors.fgMuted, border: t.colors.border },
    green: { fg: t.colors.green, border: t.colors.green + "55" },
    amber: { fg: t.colors.amber, border: t.colors.amber + "55" },
    red: { fg: t.colors.red, border: t.colors.red + "55" },
  };
  const { fg, border } = toneColors[tone];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: t.colors.bg,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text
        style={{
          fontFamily: t.fonts.mono,
          fontSize: 10,
          fontWeight: "500",
          color: fg,
          letterSpacing: 0.4,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────

export function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        backgroundColor: value ? t.colors.fg : t.colors.borderStrong,
        justifyContent: "center",
        padding: 2,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#ffffff",
          transform: [{ translateX: value ? 18 : 0 }],
          ...StyleSheet.flatten({
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }),
        }}
      />
    </Pressable>
  );
}

// ─── Segmented control ───────────────────────────────────────────────

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: t.colors.bgElev,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: 8,
        padding: 2,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: active ? t.colors.bg : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: t.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: active ? t.colors.fg : t.colors.fgMuted,
                fontWeight: "500",
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── IconButton ──────────────────────────────────────────────────────

export function IconButton({
  onPress,
  children,
  size = 36,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: pressed ? t.colors.borderStrong : t.colors.border,
        backgroundColor: pressed ? t.colors.bgElev : "transparent",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      {children}
    </Pressable>
  );
}

// ─── LogoMark ────────────────────────────────────────────────────────

export function LogoMark({ size = 24 }: { size?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: t.colors.fg,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: t.colors.bg,
          fontFamily: t.fonts.mono,
          fontSize: 12,
          fontWeight: "700",
          lineHeight: 14,
        }}
      >
        ▲
      </Text>
    </View>
  );
}

// ─── AppHeader ───────────────────────────────────────────────────────

export function AppHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: t.colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <LogoMark />
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: t.colors.fg,
            letterSpacing: -0.4,
          }}
        >
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

// ─── ThemeToggle (header right) ──────────────────────────────────────

export function ThemeToggleButton() {
  const t = useTheme();
  return (
    <IconButton onPress={t.toggle}>
      <Text style={{ fontSize: 16, color: t.colors.fg }}>
        {t.isDark ? "☀" : "☾"}
      </Text>
    </IconButton>
  );
}

// ─── Bar gauge ───────────────────────────────────────────────────────

export function Bar({ value }: { value: number }) {
  const t = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{
        height: 4,
        backgroundColor: t.colors.bgElev2,
        borderRadius: 2,
        overflow: "hidden",
        marginTop: 8,
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${clamped * 100}%`,
          backgroundColor: t.colors.fg,
        }}
      />
    </View>
  );
}
