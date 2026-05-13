import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CommandInput } from "../../components/CommandInput";
import { StatusBadge } from "../../components/StatusBadge";
import { TerminalOutput } from "../../components/TerminalOutput";
import { getSessionGit, sendSignal, sendText } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { ScreenData, SessionGitInfo, WSMessage } from "../../lib/types";
import { DashboardWebSocket } from "../../lib/websocket";
import { useStore } from "../../store/useStore";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "Courier" });

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id || "";
  const { outputBuffer, setOutput, sessions } = useStore();
  const lines = outputBuffer[sessionId] || [];
  const wsRef = useRef<DashboardWebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [git, setGit] = useState<SessionGitInfo | null>(null);

  const session = sessions.find((s) => s.session_id === sessionId);

  const handleMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type === "screen") {
        const data = msg as ScreenData;
        setOutput(data.session_id, data.lines);
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

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const fetchGit = async () => {
      try {
        const info = await getSessionGit(sessionId);
        if (!cancelled) setGit(info);
      } catch {
        // ignore — keep last known state
      }
    };
    fetchGit();
    const interval = setInterval(fetchGit, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

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

  const handleSignal = useCallback(
    async (signal: string) => {
      try {
        await sendSignal(sessionId, signal);
      } catch {
        // ignore
      }
    },
    [sessionId]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.name} numberOfLines={1}>
            {session?.name || sessionId}
          </Text>
          <View style={styles.badges}>
            {session?.agent_type && (
              <StatusBadge
                label={session.agent_type}
                color={
                  session.agent_type === "claude"
                    ? theme.colors.claude
                    : theme.colors.codex
                }
              />
            )}
            <StatusBadge
              label={connected ? "Live" : "Connecting"}
              color={connected ? theme.colors.success : theme.colors.warning}
            />
          </View>
        </View>

        <GitLine git={git} />
      </View>

      <TerminalOutput lines={lines} />

      <CommandInput onSend={handleSend} onSignal={handleSignal} />
    </KeyboardAvoidingView>
  );
}

function GitLine({ git }: { git: SessionGitInfo | null }) {
  if (!git || !git.is_repo) return null;
  const dirty = git.changed_files + git.untracked > 0;
  return (
    <View style={styles.gitRow}>
      <Text style={styles.gitIcon}></Text>
      <Text style={styles.gitBranch} numberOfLines={1}>
        {git.branch || "—"}
      </Text>
      {git.worktree && (
        <>
          <Text style={styles.gitSep}>·</Text>
          <Text style={styles.gitWorktree} numberOfLines={1}>
            {git.is_worktree ? "⌥ " : ""}
            {git.worktree}
          </Text>
        </>
      )}
      {dirty ? (
        <View style={styles.gitStats}>
          {git.changed_files > 0 && (
            <Text style={styles.gitFiles}>{git.changed_files}f</Text>
          )}
          {git.insertions > 0 && (
            <Text style={styles.gitIns}>+{git.insertions}</Text>
          )}
          {git.deletions > 0 && (
            <Text style={styles.gitDel}>-{git.deletions}</Text>
          )}
          {git.untracked > 0 && (
            <Text style={styles.gitUntracked}>?{git.untracked}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.gitClean}>clean</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 6,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
    fontFamily: MONO,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  gitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  gitIcon: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginRight: 2,
  },
  gitBranch: {
    color: theme.colors.primary,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 180,
  },
  gitSep: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  gitWorktree: {
    color: theme.colors.textSecondary,
    fontFamily: MONO,
    fontSize: 12,
    maxWidth: 160,
  },
  gitStats: {
    flexDirection: "row",
    gap: 6,
    marginLeft: "auto",
  },
  gitFiles: {
    color: theme.colors.warning,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: "600",
  },
  gitIns: {
    color: theme.colors.success,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: "600",
  },
  gitDel: {
    color: theme.colors.danger,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: "600",
  },
  gitUntracked: {
    color: theme.colors.textSecondary,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: "600",
  },
  gitClean: {
    color: theme.colors.textMuted,
    fontFamily: MONO,
    fontSize: 12,
    marginLeft: "auto",
  },
});
