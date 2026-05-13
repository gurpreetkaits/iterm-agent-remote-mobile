import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProcessInfo, SessionInfo, StyledLine } from "../lib/types";
import type { ThemeMode } from "../lib/theme";

interface DashboardState {
  // Connection
  serverUrl: string | null;
  token: string | null;
  connected: boolean;
  itermConnected: boolean;

  setConnection: (url: string, token: string) => void;
  setConnected: (connected: boolean) => void;
  setItermConnected: (connected: boolean) => void;
  logout: () => void;

  // Sessions
  sessions: SessionInfo[];
  setSessions: (sessions: SessionInfo[]) => void;

  // Agents
  agents: ProcessInfo[];
  setAgents: (agents: ProcessInfo[]) => void;

  // Active session output
  activeSessionId: string | null;
  outputBuffer: Record<string, StyledLine[]>;
  setActiveSession: (id: string | null) => void;
  setOutput: (sessionId: string, lines: StyledLine[]) => void;
  clearOutput: (sessionId: string) => void;

  // UI prefs
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  notifySessionErrors: boolean;
  notifyHostOffline: boolean;
  notifyLongJobs: boolean;
  setNotify: (key: "notifySessionErrors" | "notifyHostOffline" | "notifyLongJobs", value: boolean) => void;
  autoReconnect: boolean;
  setAutoReconnect: (value: boolean) => void;
  terminalFontSize: number;
  setTerminalFontSize: (size: number) => void;
}

export const useStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Connection
      serverUrl: null,
      token: null,
      connected: false,
      itermConnected: false,

      setConnection: (serverUrl, token) => set({ serverUrl, token }),
      setConnected: (connected) => set({ connected }),
      setItermConnected: (itermConnected) => set({ itermConnected }),
      logout: () =>
        set({
          serverUrl: null,
          token: null,
          connected: false,
          sessions: [],
          agents: [],
          outputBuffer: {},
        }),

      // Sessions
      sessions: [],
      setSessions: (sessions) => set({ sessions }),

      // Agents
      agents: [],
      setAgents: (agents) => set({ agents }),

      // Output
      activeSessionId: null,
      outputBuffer: {},
      setActiveSession: (id) => set({ activeSessionId: id }),
      setOutput: (sessionId, lines) =>
        set((state) => ({
          outputBuffer: {
            ...state.outputBuffer,
            [sessionId]: lines.slice(-500), // keep last 500 lines
          },
        })),
      clearOutput: (sessionId) =>
        set((state) => {
          const { [sessionId]: _, ...rest } = state.outputBuffer;
          return { outputBuffer: rest };
        }),

      // UI prefs
      themeMode: "auto",
      setThemeMode: (themeMode) => set({ themeMode }),
      notifySessionErrors: true,
      notifyHostOffline: true,
      notifyLongJobs: false,
      setNotify: (key, value) => set({ [key]: value } as any),
      autoReconnect: true,
      setAutoReconnect: (autoReconnect) => set({ autoReconnect }),
      terminalFontSize: 14,
      setTerminalFontSize: (terminalFontSize) =>
        set({ terminalFontSize: Math.max(8, Math.min(32, terminalFontSize)) }),
    }),
    {
      name: "iterm-dashboard",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        token: state.token,
        themeMode: state.themeMode,
        notifySessionErrors: state.notifySessionErrors,
        notifyHostOffline: state.notifyHostOffline,
        notifyLongJobs: state.notifyLongJobs,
        autoReconnect: state.autoReconnect,
        terminalFontSize: state.terminalFontSize,
      }),
    }
  )
);

export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useStore.persist.hasHydrated()
  );
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
