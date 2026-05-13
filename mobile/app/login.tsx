import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { LogoMark } from "../components/ui";
import { checkHealth } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import { useStore } from "../store/useStore";

export default function LoginScreen() {
  const t = useTheme();
  const savedUrl = useStore((s) => s.serverUrl);
  const savedToken = useStore((s) => s.token);
  const [serverUrl, setServerUrl] = useState(savedUrl ?? "");
  const [token, setToken] = useState(savedToken ?? "");
  const [loading, setLoading] = useState(false);
  const setConnection = useStore((s) => s.setConnection);
  const setConnected = useStore((s) => s.setConnected);
  const setItermConnected = useStore((s) => s.setItermConnected);

  const handleConnect = async () => {
    const url = serverUrl.replace(/\/$/, "");
    if (!url || !token) {
      Alert.alert("Missing fields", "Server URL and token are both required");
      return;
    }

    setLoading(true);
    setConnection(url, token);

    try {
      const health = await checkHealth();
      setConnected(true);
      setItermConnected(health.iterm_connected);
      router.replace("/(tabs)");
    } catch (e: any) {
      setConnected(false);
      Alert.alert("Connection failed", e.message || "Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <LogoMark size={40} />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: t.colors.fg,
              marginTop: 12,
              letterSpacing: -0.6,
            }}
          >
            tmx
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: t.colors.fgMuted,
              marginTop: 4,
            }}
          >
            Connect to your Mac over Tailscale
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <View>
            <Text
              style={{
                fontSize: 11,
                color: t.colors.fgMuted,
                fontFamily: t.fonts.mono,
                marginBottom: 6,
                letterSpacing: 0.6,
              }}
            >
              SERVER URL
            </Text>
            <TextInput
              style={{
                backgroundColor: t.colors.bgElev,
                borderWidth: 1,
                borderColor: t.colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: t.colors.fg,
                fontFamily: t.fonts.mono,
                fontSize: 14,
              }}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://100.x.x.x:8420"
              placeholderTextColor={t.colors.fgSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="url"
            />
          </View>

          <View>
            <Text
              style={{
                fontSize: 11,
                color: t.colors.fgMuted,
                fontFamily: t.fonts.mono,
                marginBottom: 6,
                letterSpacing: 0.6,
              }}
            >
              API TOKEN
            </Text>
            <TextInput
              style={{
                backgroundColor: t.colors.bgElev,
                borderWidth: 1,
                borderColor: t.colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: t.colors.fg,
                fontFamily: t.fonts.mono,
                fontSize: 14,
              }}
              value={token}
              onChangeText={setToken}
              placeholder="Paste from server/.env"
              placeholderTextColor={t.colors.fgSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              secureTextEntry
            />
          </View>

          <Pressable
            onPress={handleConnect}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: t.colors.fg,
              borderRadius: 8,
              padding: 14,
              alignItems: "center",
              marginTop: 8,
              opacity: loading ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: t.colors.bg, fontSize: 14, fontWeight: "700" }}>
              {loading ? "Connecting…" : "Connect"}
            </Text>
          </Pressable>
        </View>

        <Text
          style={{
            fontSize: 11,
            color: t.colors.fgMuted,
            fontFamily: t.fonts.mono,
            textAlign: "center",
            marginTop: 24,
            lineHeight: 18,
          }}
        >
          Use your Mac's Tailscale IP and the token from{" "}
          <Text style={{ color: t.colors.fg }}>server/.env</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
