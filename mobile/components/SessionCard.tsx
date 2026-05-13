import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { theme } from "../lib/theme";
import type { SessionInfo } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  session: SessionInfo;
  onPress?: () => void;
}

export function SessionCard({ session, onPress }: Props) {
  const agentColor =
    session.agent_type === "claude"
      ? theme.colors.claude
      : session.agent_type === "codex"
        ? theme.colors.codex
        : theme.colors.primary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {session.name || "Untitled"}
        </Text>
        {session.agent_type ? (
          <StatusBadge label={session.agent_type} color={agentColor} />
        ) : (
          <StatusBadge label="shell" color={theme.colors.textSecondary} />
        )}
      </View>

      <View style={styles.meta}>
        <Text style={styles.id}>{session.session_id}</Text>
        <Text style={styles.size}>
          {session.grid_size.width}x{session.grid_size.height}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  id: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: "Courier",
  },
  size: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontFamily: "Courier",
  },
});
