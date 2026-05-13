import React, { useCallback, useEffect, useRef } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { ProcessCard } from "../../components/ProcessCard";
import { StatusBadge } from "../../components/StatusBadge";
import { startAgent } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { DashboardData, WSMessage } from "../../lib/types";
import { DashboardWebSocket } from "../../lib/websocket";
import { useStore } from "../../store/useStore";

export default function DashboardScreen() {
  const {
    sessions,
    agents,
    itermConnected,
    setSessions,
    setAgents,
    setItermConnected,
  } = useStore();
  const wsRef = useRef<DashboardWebSocket | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The WS feed will update automatically, just trigger a visual refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleStartAgent = async (agent: "claude" | "codex") => {
    try {
      await startAgent(agent);
    } catch {
      // handle silently
    }
  };

  const agentSessions = sessions.filter((s) => s.is_agent);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      ListHeaderComponent={
        <>
          {/* Status Bar */}
          <View style={styles.statusRow}>
            <StatusBadge
              label={itermConnected ? "iTerm Connected" : "iTerm Disconnected"}
              color={
                itermConnected ? theme.colors.success : theme.colors.danger
              }
            />
            <Text style={styles.statsText}>
              {sessions.length} sessions | {agents.length} agents
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: theme.colors.claude }]}
              onPress={() => handleStartAgent("claude")}
            >
              <Text style={[styles.actionText, { color: theme.colors.claude }]}>
                + Claude
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: theme.colors.codex }]}
              onPress={() => handleStartAgent("codex")}
            >
              <Text style={[styles.actionText, { color: theme.colors.codex }]}>
                + Codex
              </Text>
            </TouchableOpacity>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionTitle}>
            Agent Processes ({agents.length})
          </Text>
        </>
      }
      data={agents}
      keyExtractor={(item) => String(item.pid)}
      renderItem={({ item }) => (
        <ProcessCard
          process={item}
          onPress={() => {
            if (item.session_id) {
              router.push(`/session/${item.session_id}`);
            }
          }}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No agent processes detected</Text>
          <Text style={styles.emptyHint}>
            Start a Claude or Codex session above
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  statsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  actionText: {
    fontSize: theme.fontSize.md,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emptyHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
