import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";

import { theme } from "../../lib/theme";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: "D",
    Sessions: "S",
    Control: "C",
    Settings: "G",
  };
  return (
    <Text
      style={{
        fontFamily: "Courier",
        fontWeight: "700",
        fontSize: 18,
        color: focused ? theme.colors.primary : theme.colors.textMuted,
      }}
    >
      {icons[name] || "?"}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: "Sessions",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Sessions" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="control"
        options={{
          title: "Control",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Control" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
