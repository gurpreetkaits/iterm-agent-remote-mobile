import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProcessInfo, SessionInfo, StyledLine } from "../lib/types";

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
    }),
    {
      name: "iterm-dashboard",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        token: state.token,
      }),
    }
  )
);
