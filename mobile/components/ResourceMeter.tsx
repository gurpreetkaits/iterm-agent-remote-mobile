import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../lib/theme";

interface Props {
  label: string;
  value: number;
  max: number;
  unit: string;
  color?: string;
}

export function ResourceMeter({
  label,
  value,
  max,
  unit,
  color = theme.colors.primary,
}: Props) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value.toFixed(1)} {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontFamily: "Courier",
  },
  track: {
    height: 4,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});
