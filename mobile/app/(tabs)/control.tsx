import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";

import {
  CommandInput,
  CommandInputHandle,
} from "../../components/CommandInput";
import { TerminalOutput } from "../../components/TerminalOutput";
import { sendText } from "../../lib/api";
import { useTheme } from "../../lib/ThemeContext";
import type { Cursor, ScreenData, WSMessage } from "../../lib/types";
import { DashboardWebSocket } from "../../lib/websocket";
import { useStore } from "../../store/useStore";

export default function ControlScreen() {
  const t = useTheme();
  const nav = useNavigation();
  const {
    sessions,
    activeSessionId,
    outputBuffer,
    setOutput,
    setActiveSession,
  } = useStore();

  const resolvedSession = (() => {
    if (activeSessionId) {
      const found = sessions.find((s) => s.session_id === activeSessionId);
      if (found) return found;
    }
    return sessions[0] || null;
  })();
  const sessionId = resolvedSession?.session_id ?? "";

  useEffect(() => {
    if (!activeSessionId && resolvedSession) {
      setActiveSession(resolvedSession.session_id);
    }
  }, [activeSessionId, resolvedSession, setActiveSession]);

  const lines = outputBuffer[sessionId] || [];
  const wsRef = useRef<DashboardWebSocket | null>(null);
  const inputRef = useRef<CommandInputHandle>(null);
  const [, setConnected] = useState(false);
  const [cursor, setCursor] = useState<Cursor | null>(null);

  const handleMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type === "screen") {
        const data = msg as ScreenData;
        setOutput(data.session_id, data.lines);
        if (data.cursor) setCursor(data.cursor);
        setConnected(true);
      } else if (msg.type === "heartbeat") {
        setConnected(true);
      }
    },
    [setOutput]
  );

  useEffect(() => {
    if (!sessionId) return;
    const ws = new DashboardWebSocket(
      `/ws/session/${sessionId}/output`,
      handleMessage
    );
    ws.connect();
    wsRef.current = ws;
    setConnected(false);
    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [sessionId, handleMessage]);

  // Hide bottom tab bar while the keyboard is open so the modifier-keys row
  // sits flush against the keyboard.
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        (nav as any).getParent()?.setOptions({
          tabBarStyle: { display: "none" },
        });
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        (nav as any).getParent()?.setOptions({
          tabBarStyle: undefined,
        });
      }
    );
    return () => {
      show.remove();
      hide.remove();
      (nav as any).getParent()?.setOptions({ tabBarStyle: undefined });
    };
  }, [nav]);

  const handleSend = useCallback(
    async (text: string, newline = true) => {
      if (!sessionId) return;
      try {
        await sendText(sessionId, text, newline);
      } catch {
        wsRef.current?.send({ type: "send", text, newline });
      }
    },
    [sessionId]
  );

  if (!resolvedSession) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.bg,
          padding: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.colors.bgElev,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 22,
                color: t.colors.fgMuted,
              }}
            >
              ›_
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: t.colors.fg,
              marginTop: 8,
            }}
          >
            No session attached
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/sessions")}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: t.colors.fg,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{ color: t.colors.bg, fontWeight: "600", fontSize: 13 }}
            >
              Open Sessions
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.colors.termBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => inputRef.current?.focus()}
      >
        <TerminalOutput lines={lines} cursor={cursor} />
      </Pressable>
      <CommandInput ref={inputRef} onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}
