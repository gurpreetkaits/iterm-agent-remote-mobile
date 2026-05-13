import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { theme } from "../lib/theme";
import type { ProcessInfo } from "../lib/types";
import { ResourceMeter } from "./ResourceMeter";
import { StatusBadge } from "./StatusBadge";

interface Props {
  process: ProcessInfo;
  onPress?: () => void;
}

export function ProcessCard({ process, onPress }: Props) {
  const agentColor =
    process.agent_type === "claude"
      ? theme.colors.claude
      : theme.colors.codex;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {process.agent_type || process.name}
        </Text>
        <StatusBadge
          label={process.status}
          color={
            process.status === "running"
              ? theme.colors.success
              : theme.colors.warning
          }
        />
      </View>

      {process.agent_type && (
        <View style={[styles.agentBadge, { borderColor: agentColor }]}>
          <Text style={[styles.agentText, { color: agentColor }]}>
            {process.agent_type.toUpperCase()}
          </Text>
        </View>
      )}

      <Text style={styles.pid}>PID: {process.pid}</Text>
      {process.working_directory && (
        <Text style={styles.cwd} numberOfLines={1}>
          {process.working_directory}
        </Text>
      )}

      <View style={styles.meters}>
        <ResourceMeter
          label="CPU"
          value={process.cpu_percent}
          max={100}
          unit="%"
          color={theme.colors.primary}
        />
        <ResourceMeter
          label="Memory"
          value={process.memory_mb}
          max={1024}
          unit="MB"
          color={theme.colors.warning}
        />
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
    gap: 8,
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
  },
  agentBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  agentText: {
    fontSize: theme.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Courier",
  },
  pid: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontFamily: "Courier",
  },
  cwd: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: "Courier",
  },
  meters: {
    gap: 8,
    marginTop: 4,
  },
});
