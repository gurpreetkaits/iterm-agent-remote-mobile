import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createTab,
  listArrangements,
  restoreArrangement,
  saveArrangement,
  splitPane,
} from "../../lib/api";
import { theme } from "../../lib/theme";
import { useStore } from "../../store/useStore";

export default function ControlScreen() {
  const sessions = useStore((s) => s.sessions);
  const [arrangements, setArrangements] = useState<string[]>([]);
  const [newArrangementName, setNewArrangementName] = useState("");

  const fetchArrangements = useCallback(async () => {
    try {
      const data = await listArrangements();
      setArrangements(data.arrangements);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchArrangements();
  }, [fetchArrangements]);

  const handleNewTab = async () => {
    try {
      await createTab();
      Alert.alert("Success", "New tab created");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSplitH = async () => {
    if (!sessions.length) return;
    try {
      await splitPane(sessions[0].session_id, false);
      Alert.alert("Success", "Pane split horizontally");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSplitV = async () => {
    if (!sessions.length) return;
    try {
      await splitPane(sessions[0].session_id, true);
      Alert.alert("Success", "Pane split vertically");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSaveArrangement = async () => {
    if (!newArrangementName.trim()) return;
    try {
      await saveArrangement(newArrangementName.trim());
      setNewArrangementName("");
      await fetchArrangements();
      Alert.alert("Success", "Arrangement saved");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleRestoreArrangement = async (name: string) => {
    try {
      await restoreArrangement(name);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Tab / Pane Controls */}
      <Text style={styles.sectionTitle}>Tab & Pane Management</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btn} onPress={handleNewTab}>
          <Text style={styles.btnText}>New Tab</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleSplitV}>
          <Text style={styles.btnText}>Split |</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleSplitH}>
          <Text style={styles.btnText}>Split --</Text>
        </TouchableOpacity>
      </View>

      {/* Current Layout */}
      <Text style={styles.sectionTitle}>Current Sessions</Text>
      <View style={styles.layoutGrid}>
        {sessions.map((session) => (
          <View key={session.session_id} style={styles.layoutCell}>
            <Text style={styles.cellName} numberOfLines={1}>
              {session.name || "Shell"}
            </Text>
            <Text style={styles.cellSize}>
              {session.grid_size.width}x{session.grid_size.height}
            </Text>
          </View>
        ))}
        {sessions.length === 0 && (
          <Text style={styles.emptyText}>No sessions</Text>
        )}
      </View>

      {/* Arrangements */}
      <Text style={styles.sectionTitle}>Window Arrangements</Text>
      <View style={styles.saveRow}>
        <TextInput
          style={styles.input}
          value={newArrangementName}
          onChangeText={setNewArrangementName}
          placeholder="Arrangement name"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveArrangement}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {arrangements.map((name) => (
        <TouchableOpacity
          key={name}
          style={styles.arrangementItem}
          onPress={() => handleRestoreArrangement(name)}
        >
          <Text style={styles.arrangementName}>{name}</Text>
          <Text style={styles.arrangementAction}>Restore</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    alignItems: "center",
  },
  btnText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: theme.fontSize.sm,
  },
  layoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  layoutCell: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    minWidth: "45%",
    flexGrow: 1,
  },
  cellName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  cellSize: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontFamily: "Courier",
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
  },
  saveRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: theme.fontSize.sm,
  },
  arrangementItem: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  arrangementName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  arrangementAction: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
});
