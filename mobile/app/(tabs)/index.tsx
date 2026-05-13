import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Badge,
  Bar,
  Card,
  CardRow,
  Dot,
  SectionLabel,
} from "../../components/ui";
import { getSystemInfo } from "../../lib/api";
import { useTheme } from "../../lib/ThemeContext";
import type { DashboardData, SystemInfo, WSMessage } from "../../lib/types";
import { DashboardWebSocket } from "../../lib/websocket";
import { useStore } from "../../store/useStore";

function fmtUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function fmtBytes(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 10 ? gb.toFixed(0) : gb.toFixed(1);
}

function hostFromUrl(url: string | null): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split(":")[0];
  }
}

export default function DashboardScreen() {
  const t = useTheme();
  const {
    sessions,
    agents,
    itermConnected,
    serverUrl,
    setSessions,
    setAgents,
    setItermConnected,
    setActiveSession,
  } = useStore();
  const wsRef = useRef<DashboardWebSocket | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  const handleMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type === "dashboard") {
        const data = msg as DashboardData;
        setSessions(data.sessions);
        setAgents(data.agents);
        setItermConnected(data.iterm_connected);
      }
    },
    [setSessions, setAgents, setItermConnected]
  );

  useEffect(() => {
    const ws = new DashboardWebSocket("/ws/dashboard", handleMessage);
    ws.connect();
    wsRef.current = ws;
    return () => ws.disconnect();
  }, [handleMessage]);

  const fetchSys = useCallback(async () => {
    try {
      const info = await getSystemInfo();
      setSysInfo(info);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSys();
    const id = setInterval(fetchSys, 5000);
    return () => clearInterval(id);
  }, [fetchSys]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSys();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchSys]);

  const cpuValue = sysInfo?.cpu_percent ?? 0;
  const memValue = sysInfo?.memory_percent ?? 0;
  const memUsedGb = sysInfo ? fmtBytes(sysInfo.memory_used) : "—";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={t.colors.fg}
        />
      }
    >
      <View
        style={{
          backgroundColor: t.colors.bgElev,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.md,
          padding: 18,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Dot tone={itermConnected ? "green" : "red"} />
              <Text
                style={{
                  fontFamily: t.fonts.mono,
                  fontSize: 13,
                  fontWeight: "500",
                  color: t.colors.fg,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {sysInfo?.hostname || "—"}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 11,
                color: t.colors.fgMuted,
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {hostFromUrl(serverUrl)} · tailnet
            </Text>
          </View>
          <Badge tone={itermConnected ? "green" : "red"}>
            {itermConnected ? "CONNECTED" : "OFFLINE"}
          </Badge>
        </View>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <StatBox
            label="Sessions"
            value={String(sessions.length)}
            sub={`${agents.length} agents`}
          />
          <StatBox
            label="Uptime"
            value={fmtUptime(sysInfo?.host_uptime_seconds ?? 0)}
            sub="host machine"
          />
          <StatBox
            label="CPU"
            value={
              <>
                {cpuValue.toFixed(0)}
                <Text style={{ fontSize: 14, color: t.colors.fgMuted }}>%</Text>
              </>
            }
            bar={cpuValue / 100}
          />
          <StatBox
            label="Memory"
            value={
              <>
                {memUsedGb}
                <Text style={{ fontSize: 14, color: t.colors.fgMuted }}>G</Text>
              </>
            }
            bar={memValue / 100}
          />
        </View>
      </View>

      <SectionLabel>Quick actions</SectionLabel>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <QuickAction
          title="Sessions"
          sub={`${sessions.length} active`}
          onPress={() => router.push("/(tabs)/sessions")}
        />
        <QuickAction
          title="Open last"
          sub={sessions[0]?.name || "—"}
          onPress={() => {
            if (sessions[0]) {
              setActiveSession(sessions[0].session_id);
              router.push("/(tabs)/control");
            }
          }}
        />
        <QuickAction
          title="Agents"
          sub={`${agents.length} processes`}
          onPress={() => router.push("/(tabs)/sessions")}
        />
        <QuickAction
          title="Tailscale"
          sub={hostFromUrl(serverUrl)}
          onPress={() => router.push("/(tabs)/settings")}
        />
      </View>

      <SectionLabel>Recent activity</SectionLabel>
      <Card>
        {sessions.length === 0 ? (
          <CardRow last>
            <Text style={{ color: t.colors.fgMuted, fontSize: 13 }}>
              No sessions yet
            </Text>
          </CardRow>
        ) : (
          sessions.slice(0, 4).map((s, i) => (
            <CardRow
              key={s.session_id}
              last={i === Math.min(sessions.length, 4) - 1}
              onPress={() => {
                setActiveSession(s.session_id);
                router.push("/(tabs)/control");
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: t.colors.bgElev,
                    borderWidth: 1,
                    borderColor: t.colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: t.fonts.mono,
                      fontSize: 11,
                      fontWeight: "600",
                      color: t.colors.fg,
                    }}
                  >
                    {s.is_agent ? "▶" : "•"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, color: t.colors.fg }}
                    numberOfLines={1}
                  >
                    <Text
                      style={{ fontFamily: t.fonts.mono, fontWeight: "500" }}
                    >
                      {s.name || "shell"}
                    </Text>
                    {s.agent_type ? ` · ${s.agent_type}` : ""}
                  </Text>
                  <Text
                    style={{
                      fontFamily: t.fonts.mono,
                      fontSize: 11,
                      color: t.colors.fgMuted,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {s.grid_size.width}×{s.grid_size.height} · tab {s.tab_id}
                  </Text>
                </View>
              </View>
              <Text style={{ color: t.colors.fgSubtle, fontSize: 16 }}>›</Text>
            </CardRow>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  sub,
  bar,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  bar?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "47%",
        backgroundColor: t.colors.bg,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: t.radius.sm,
        padding: 12,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: t.colors.fgMuted,
          fontFamily: t.fonts.mono,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          color: t.colors.fg,
          fontFamily: t.fonts.mono,
          marginTop: 6,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      {bar !== undefined ? (
        <Bar value={bar} />
      ) : sub ? (
        <Text
          style={{
            fontSize: 11,
            color: t.colors.fgMuted,
            fontFamily: t.fonts.mono,
            marginTop: 6,
          }}
          numberOfLines={1}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function QuickAction({
  title,
  sub,
  onPress,
}: {
  title: string;
  sub: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: "47%",
        backgroundColor: pressed ? t.colors.bgElev : t.colors.bg,
        borderWidth: 1,
        borderColor: pressed ? t.colors.borderStrong : t.colors.border,
        borderRadius: t.radius.sm,
        padding: 14,
      })}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: t.colors.fg,
          marginBottom: 2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: t.colors.fgMuted,
          fontFamily: t.fonts.mono,
        }}
        numberOfLines={1}
      >
        {sub}
      </Text>
    </Pressable>
  );
}
