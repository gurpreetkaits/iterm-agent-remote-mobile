import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { AppHeader, ThemeToggleButton } from "../../components/ui";
import { useTheme } from "../../lib/ThemeContext";

type TabKey = "index" | "sessions" | "control" | "settings";

const TITLES: Record<TabKey, string> = {
  index: "Dashboard",
  sessions: "Sessions",
  control: "Control",
  settings: "Settings",
};

function TabIcon({ name, color }: { name: TabKey; color: string }) {
  const stroke = { borderWidth: 1.5, borderColor: color };
  if (name === "index") {
    return (
      <View style={{ width: 22, height: 22 }}>
        <View style={[styles.cell, stroke, { width: 9, height: 11, left: 0, top: 0 }]} />
        <View style={[styles.cell, stroke, { width: 9, height: 6, right: 0, top: 0 }]} />
        <View style={[styles.cell, stroke, { width: 9, height: 11, right: 0, bottom: 0 }]} />
        <View style={[styles.cell, stroke, { width: 9, height: 6, left: 0, bottom: 0 }]} />
      </View>
    );
  }
  if (name === "sessions") {
    return (
      <View
        style={{
          width: 22,
          height: 18,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 3,
          paddingHorizontal: 3,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color,
            fontSize: 10,
            lineHeight: 12,
            fontFamily: "Menlo",
            fontWeight: "700",
          }}
        >
          {">_"}
        </Text>
      </View>
    );
  }
  if (name === "control") {
    return (
      <View
        style={{
          width: 22,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 18,
            height: 2,
            backgroundColor: color,
            top: 10,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 2,
            height: 18,
            backgroundColor: color,
            left: 10,
          }}
        />
      </View>
    );
  }
  return (
    <View
      style={{
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  return (
    <SafeAreaView
      style={{
        backgroundColor: t.colors.bg,
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const name = route.name as TabKey;
          const color = focused ? t.colors.fg : t.colors.fgSubtle;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                gap: 3,
              }}
            >
              <TabIcon name={name} color={color} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  color,
                  letterSpacing: 0.2,
                }}
              >
                {TITLES[name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        header: () => (
          <AppHeader
            title={TITLES[route.name as TabKey] ?? "tmx"}
            right={<ThemeToggleButton />}
          />
        ),
        sceneStyle: { backgroundColor: t.colors.bg },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="control" options={{ headerShown: false }} />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cell: { position: "absolute", borderRadius: 1.5 },
});
