import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { checkHealth } from "../lib/api";
import { theme } from "../lib/theme";
import { useStore } from "../store/useStore";

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const setConnection = useStore((s) => s.setConnection);
  const setConnected = useStore((s) => s.setConnected);
  const setItermConnected = useStore((s) => s.setItermConnected);

  const handleConnect = async () => {
    const url = serverUrl.replace(/\/$/, "");
    if (!url || !token) {
      Alert.alert("Error", "Please enter both server URL and token");
      return;
    }

    setLoading(true);
    // Set connection first so API client can use it
    setConnection(url, token);

    try {
      const health = await checkHealth();
      setConnected(true);
      setItermConnected(health.iterm_connected);
      router.replace("/(tabs)");
    } catch (e: any) {
      setConnected(false);
      Alert.alert(
        "Connection Failed",
        e.message || "Could not connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>iTerm Dashboard</Text>
        <Text style={styles.subtitle}>Connect to your Mac server</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://100.x.x.x:8420"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>API Token</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Your API token"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Connecting..." : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Use your Tailscale IP or ngrok URL.{"\n"}
          Token is in server/.env
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontFamily: "Courier",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: theme.fontSize.md,
    fontWeight: "700",
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
