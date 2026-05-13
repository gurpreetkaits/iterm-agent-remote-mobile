import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../lib/theme";

interface Props {
  label: string;
  color?: string;
}

export function StatusBadge({ label, color = theme.colors.primary }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: "600",
  },
});
