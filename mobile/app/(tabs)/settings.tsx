import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Card,
  CardRow,
  Dot,
  SectionLabel,
  Segmented,
  Toggle,
} from "../../components/ui";
import { getSystemInfo } from "../../lib/api";
import { useTheme } from "../../lib/ThemeContext";
import type { ThemeMode } from "../../lib/theme";
import type { SystemInfo } from "../../lib/types";
import { useStore } from "../../store/useStore";

function hostFromUrl(url: string | null): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split(":")[0];
  }
}

export default function SettingsScreen() {
  const t = useTheme();
  const {
    serverUrl,
    connected,
    itermConnected,
    autoReconnect,
    setAutoReconnect,
    notifySessionErrors,
    notifyHostOffline,
    notifyLongJobs,
    setNotify,
    logout,
  } = useStore();

  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  const fetchSys = useCallback(async () => {
    try {
      setSysInfo(await getSystemInfo());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSys();
  }, [fetchSys]);

  const handleDisconnect = () => {
    Alert.alert("Disconnect", "Sign out of this server?", [
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
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Connection */}
      <SectionLabel>Connection</SectionLabel>
      <Card>
        <CardRow>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>Status</Text>
            <Text
              style={{
                fontSize: 12,
                color: t.colors.fgMuted,
                fontFamily: t.fonts.mono,
                marginTop: 2,
              }}
            >
              {hostFromUrl(serverUrl)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Dot tone={connected ? "green" : "red"} />
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 13,
                color: t.colors.fgMuted,
              }}
            >
              {connected ? "Connected" : "Offline"}
            </Text>
          </View>
        </CardRow>
        <CardRow>
          <Text style={{ fontSize: 14, color: t.colors.fg }}>iTerm2</Text>
          <Text
            style={{
              fontFamily: t.fonts.mono,
              fontSize: 13,
              color: itermConnected ? t.colors.green : t.colors.red,
            }}
          >
            {itermConnected ? "Connected" : "Disconnected"}
          </Text>
        </CardRow>
        <CardRow>
          <Text style={{ fontSize: 14, color: t.colors.fg }}>Host</Text>
          <Text
            style={{
              fontFamily: t.fonts.mono,
              fontSize: 13,
              color: t.colors.fgMuted,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {sysInfo?.hostname || "—"}
          </Text>
        </CardRow>
        <CardRow last>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>
              Reconnect on launch
            </Text>
          </View>
          <Toggle value={autoReconnect} onChange={setAutoReconnect} />
        </CardRow>
      </Card>

      {/* iTerm */}
      <View style={{ marginTop: 24 }}>
        <SectionLabel>iTerm2</SectionLabel>
        <Card>
          <CardRow>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>Platform</Text>
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 13,
                color: t.colors.fgMuted,
              }}
            >
              {sysInfo?.platform || "—"}
            </Text>
          </CardRow>
          <CardRow>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>Python</Text>
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 13,
                color: t.colors.fgMuted,
              }}
            >
              {sysInfo?.python_version || "—"}
            </Text>
          </CardRow>
          <CardRow last>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>CPU cores</Text>
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 13,
                color: t.colors.fgMuted,
              }}
            >
              {sysInfo?.cpu_count ?? "—"}
            </Text>
          </CardRow>
        </Card>
      </View>

      {/* Appearance */}
      <View style={{ marginTop: 24 }}>
        <SectionLabel>Appearance</SectionLabel>
        <Card>
          <CardRow last>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>Theme</Text>
            <Segmented<ThemeMode>
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "auto", label: "Auto" },
              ]}
              value={t.mode}
              onChange={t.setMode}
            />
          </CardRow>
        </Card>
      </View>

      {/* Notifications */}
      <View style={{ marginTop: 24 }}>
        <SectionLabel>Notifications</SectionLabel>
        <Card>
          <CardRow>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: t.colors.fg }}>
                Session errors
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: t.colors.fgMuted,
                  fontFamily: t.fonts.mono,
                  marginTop: 2,
                }}
              >
                non-zero exits
              </Text>
            </View>
            <Toggle
              value={notifySessionErrors}
              onChange={(v) => setNotify("notifySessionErrors", v)}
            />
          </CardRow>
          <CardRow>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>
              Host offline
            </Text>
            <Toggle
              value={notifyHostOffline}
              onChange={(v) => setNotify("notifyHostOffline", v)}
            />
          </CardRow>
          <CardRow last>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: t.colors.fg }}>
                Long output ping
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: t.colors.fgMuted,
                  fontFamily: t.fonts.mono,
                  marginTop: 2,
                }}
              >
                jobs &gt; 30s
              </Text>
            </View>
            <Toggle
              value={notifyLongJobs}
              onChange={(v) => setNotify("notifyLongJobs", v)}
            />
          </CardRow>
        </Card>
      </View>

      {/* About + danger */}
      <View style={{ marginTop: 24 }}>
        <SectionLabel>About</SectionLabel>
        <Card>
          <CardRow>
            <Text style={{ fontSize: 14, color: t.colors.fg }}>Version</Text>
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 13,
                color: t.colors.fgMuted,
              }}
            >
              0.1.0
            </Text>
          </CardRow>
          <CardRow last onPress={handleDisconnect}>
            <Text style={{ fontSize: 14, color: t.colors.red }}>
              Disconnect
            </Text>
            <Text style={{ color: t.colors.red, fontSize: 16 }}>›</Text>
          </CardRow>
        </Card>
      </View>
    </ScrollView>
  );
}
