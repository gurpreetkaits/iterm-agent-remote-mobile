import React, { useEffect, useState } from "react";
import { Stack, router, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { theme } from "../lib/theme";
import { useStore } from "../store/useStore";

export default function RootLayout() {
  const serverUrl = useStore((s) => s.serverUrl);
  const token = useStore((s) => s.token);
  const navState = useRootNavigationState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !navState?.key) return;
    if (serverUrl && token) return;
    const id = setTimeout(() => {
      router.replace("/login");
    }, 0);
    return () => clearTimeout(id);
  }, [mounted, navState?.key, serverUrl, token]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/[id]"
          options={{ title: "Session", presentation: "card" }}
        />
      </Stack>
    </>
  );
}
