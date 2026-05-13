import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

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

export default function SessionDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id || "";
  const { outputBuffer, setOutput } = useStore();
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
    const ws = new DashboardWebSocket(
      `/ws/session/${sessionId}/output`,
      handleMessage
    );
    ws.connect();
    wsRef.current = ws;
    return () => ws.disconnect();
  }, [sessionId, handleMessage]);

  const handleSend = useCallback(
    async (text: string, newline = true) => {
      try {
        await sendText(sessionId, text, newline);
      } catch {
        wsRef.current?.send({ type: "send", text, newline });
      }
    },
    [sessionId]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.colors.termBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
