import React, { useEffect, useState } from "react";
import { Stack, router, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { useStore, useStoreHydrated } from "../store/useStore";

function RootStack() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.colors.bg },
          headerTintColor: t.colors.fg,
          contentStyle: { backgroundColor: t.colors.bg },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/[id]"
          options={{ headerShown: false, presentation: "card" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const serverUrl = useStore((s) => s.serverUrl);
  const token = useStore((s) => s.token);
  const navState = useRootNavigationState();
  const hydrated = useStoreHydrated();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !navState?.key || !hydrated) return;
    if (serverUrl && token) return;
    const id = setTimeout(() => {
      router.replace("/login");
    }, 0);
    return () => clearTimeout(id);
  }, [mounted, navState?.key, hydrated, serverUrl, token]);

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
