import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { theme } from "../../lib/theme";
import { useStore } from "../../store/useStore";

export default function SettingsScreen() {
  const { serverUrl, connected, itermConnected, logout } = useStore();

  const handleDisconnect = () => {
    Alert.alert("Disconnect", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Server</Text>
          <Text style={styles.value}>{serverUrl || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text
            style={[
              styles.value,
              { color: connected ? theme.colors.success : theme.colors.danger },
            ]}
          >
            {connected ? "Connected" : "Disconnected"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>iTerm2</Text>
          <Text
            style={[
              styles.value,
              {
                color: itermConnected
                  ? theme.colors.success
                  : theme.colors.danger,
              },
            ]}
          >
            {itermConnected ? "Connected" : "Disconnected"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>0.1.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={handleDisconnect}>
        <Text style={styles.dangerText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: "Courier",
    flexShrink: 1,
    textAlign: "right",
  },
  dangerBtn: {
    backgroundColor: theme.colors.danger + "22",
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  dangerText: {
    color: theme.colors.danger,
    fontWeight: "700",
    fontSize: theme.fontSize.md,
  },
});
