import React, { useImperativeHandle, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../lib/ThemeContext";

interface Props {
  onSend: (text: string, newline?: boolean) => void;
}

export interface CommandInputHandle {
  focus: () => void;
}

type SpecialKey = {
  label: string;
  send: string; // raw bytes to send
};

const ROW_TOP: SpecialKey[] = [
  { label: "ESC", send: "\x1b" },
  { label: "/", send: "/" },
  { label: "—", send: "-" },
  { label: "HOME", send: "\x1b[H" },
  { label: "↑", send: "\x1b[A" },
  { label: "END", send: "\x1b[F" },
  { label: "PGUP", send: "\x1b[5~" },
];

const ROW_BOTTOM_SPECIAL: SpecialKey[] = [
  { label: "TAB", send: "\t" },
  // CTRL and ALT handled separately as sticky modifiers
  { label: "←", send: "\x1b[D" },
  { label: "↓", send: "\x1b[B" },
  { label: "→", send: "\x1b[C" },
  { label: "PGDN", send: "\x1b[6~" },
];

export const CommandInput = React.forwardRef<CommandInputHandle, Props>(
  function CommandInput({ onSend }, ref) {
    const t = useTheme();
    const inputRef = useRef<TextInput>(null);
    const [pendingCtrl, setPendingCtrl] = useState(false);
    const [pendingAlt, setPendingAlt] = useState(false);
    // Keep a tiny rotating buffer so onChangeText reliably fires.
    const [buf, setBuf] = useState(" ");

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const sendChar = (ch: string) => {
      if (!ch) return;
      let toSend = ch;
      if (pendingCtrl) {
        const code = ch.toLowerCase().charCodeAt(0);
        if (code >= 97 && code <= 122) {
          // Ctrl-A..Z = 0x01..0x1a
          toSend = String.fromCharCode(code - 96);
        } else if (ch === " ") {
          toSend = "\x00";
        } else if (ch === "[") {
          toSend = "\x1b";
        }
        setPendingCtrl(false);
      }
      if (pendingAlt) {
        toSend = "\x1b" + toSend;
        setPendingAlt(false);
      }
      onSend(toSend, false);
    };

    const handleChange = (next: string) => {
      // Anything beyond the sentinel space is new input. After processing,
      // reset back to the sentinel so subsequent keystrokes fire change.
      if (next.length > buf.length) {
        const added = next.slice(buf.length);
        // Send each character with modifier handling
        for (const ch of added) {
          sendChar(ch);
        }
      } else if (next.length < buf.length) {
        // User pressed backspace — send DEL for each removed char
        const removed = buf.length - next.length;
        for (let i = 0; i < removed; i++) {
          onSend("\x7f", false);
        }
      }
      // Re-arm with the sentinel
      setBuf(" ");
    };

    const handleKeyPress = (e: {
      nativeEvent: { key: string };
    }) => {
      // On Android onKeyPress is unreliable for chars but fires for special keys.
      // Backspace at the sentinel boundary still flows through handleChange.
      const k = e.nativeEvent.key;
      if (k === "Enter") {
        // Send newline (the onChangeText will likely also handle this; guard with no-op if not)
        // We rely on onChangeText for the actual \n send. Leave this for special handling if needed.
      }
    };

    const tapKey = (k: SpecialKey) => {
      onSend(k.send, false);
    };

    const tapCtrl = () => {
      setPendingCtrl((v) => !v);
      setPendingAlt(false);
      inputRef.current?.focus();
    };
    const tapAlt = () => {
      setPendingAlt((v) => !v);
      setPendingCtrl(false);
      inputRef.current?.focus();
    };

    return (
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: t.colors.border,
          backgroundColor: t.colors.bg,
        }}
      >
        {/* Hidden input — captures keystrokes from the system keyboard */}
        <TextInput
          ref={inputRef}
          value={buf}
          onChangeText={handleChange}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          multiline
          blurOnSubmit={false}
          // Visually invisible but focusable
          style={{
            position: "absolute",
            opacity: 0,
            height: 1,
            width: 1,
            left: -1000,
            top: -1000,
          }}
        />

        {/* Key bar */}
        <KeyRow keys={ROW_TOP} onPress={tapKey} />
        <View style={{ flexDirection: "row" }}>
          <KeyCell label="TAB" onPress={() => onSend("\t", false)} />
          <KeyCell
            label="CTRL"
            active={pendingCtrl}
            onPress={tapCtrl}
          />
          <KeyCell
            label="ALT"
            active={pendingAlt}
            onPress={tapAlt}
          />
          {ROW_BOTTOM_SPECIAL.filter((k) => k.label !== "TAB").map((k) => (
            <KeyCell key={k.label} label={k.label} onPress={() => tapKey(k)} />
          ))}
        </View>
      </View>
    );
  }
);

function KeyRow({
  keys,
  onPress,
}: {
  keys: SpecialKey[];
  onPress: (k: SpecialKey) => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      {keys.map((k) => (
        <KeyCell key={k.label} label={k.label} onPress={() => onPress(k)} />
      ))}
    </View>
  );
}

function KeyCell({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: active
            ? t.colors.fg
            : pressed
              ? t.colors.bgElev
              : "transparent",
        },
      ]}
    >
      <Text
        style={{
          color: active ? t.colors.bg : t.colors.fg,
          fontSize: 14,
          fontWeight: "600",
          fontFamily: t.fonts.mono,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 44,
  },
});
