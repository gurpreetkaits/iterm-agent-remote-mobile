import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { theme } from "../lib/theme";

interface Props {
  onSend: (text: string, newline?: boolean) => void;
  onSignal: (signal: string) => void;
}

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "Courier" });

type QuickKey = {
  label: string;
  kind: "signal" | "raw";
  value: string;
  tone?: "danger" | "warn" | "muted" | "default";
};

const QUICK_KEYS: QuickKey[] = [
  { label: "Tab", kind: "raw", value: "\t" },
  { label: "Esc", kind: "raw", value: "\x1b" },
  { label: "↑", kind: "raw", value: "\x1b[A" },
  { label: "↓", kind: "raw", value: "\x1b[B" },
  { label: "←", kind: "raw", value: "\x1b[D" },
  { label: "→", kind: "raw", value: "\x1b[C" },
  { label: "^C", kind: "signal", value: "ctrl-c", tone: "danger" },
  { label: "^D", kind: "signal", value: "ctrl-d", tone: "warn" },
  { label: "^Z", kind: "signal", value: "ctrl-z", tone: "muted" },
];

function toneColor(tone: QuickKey["tone"]) {
  switch (tone) {
    case "danger":
      return theme.colors.danger;
    case "warn":
      return theme.colors.warning;
    case "muted":
      return theme.colors.textSecondary;
    default:
      return theme.colors.primary;
  }
}

export function CommandInput({ onSend, onSignal }: Props) {
  const [text, setText] = useState("");
  const [inputHeight, setInputHeight] = useState(44);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text, true);
      setText("");
      setInputHeight(44);
    }
  };

  const handleQuickKey = (k: QuickKey) => {
    if (k.kind === "signal") {
      onSignal(k.value);
    } else {
      onSend(k.value, false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.keysRow}
      >
        {QUICK_KEYS.map((k) => {
          const color = toneColor(k.tone);
          return (
            <TouchableOpacity
              key={k.label}
              style={[styles.keyBtn, { borderColor: color }]}
              onPress={() => handleQuickKey(k)}
            >
              <Text style={[styles.keyText, { color }]}>{k.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.inputRow}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={[styles.input, { height: Math.min(Math.max(44, inputHeight), 140) }]}
          value={text}
          onChangeText={setText}
          placeholder="Type a command…"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          multiline
          onContentSizeChange={(e) =>
            setInputHeight(e.nativeEvent.contentSize.height + 12)
          }
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: 10,
  },
  keysRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  keyBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 48,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  keyText: {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  prompt: {
    color: theme.colors.success,
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: "700",
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: theme.colors.text,
    fontFamily: MONO,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
