import { useStore } from "../store/useStore";
import type {
  LayoutPreset,
  ProcessInfo,
  ScreenOutput,
  SessionGitInfo,
  SessionInfo,
  WindowInfo,
} from "./types";

function getHeaders(): Record<string, string> {
  const { token } = useStore.getState();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getBaseUrl(): string {
  const { serverUrl } = useStore.getState();
  return serverUrl || "";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// System
export async function checkHealth() {
  return request<{ status: string; iterm_connected: boolean }>("/api/system/health");
}

export async function getSystemInfo() {
  return request<Record<string, unknown>>("/api/system/info");
}

// Sessions
export async function listSessions() {
  return request<SessionInfo[]>("/api/sessions/");
}

export async function listWindows() {
  return request<WindowInfo[]>("/api/sessions/windows");
}

export async function getSession(id: string) {
  return request<SessionInfo>(`/api/sessions/${id}`);
}

export async function getScreen(id: string, lines = 100) {
  return request<ScreenOutput>(`/api/sessions/${id}/screen?lines=${lines}`);
}

export async function getSessionGit(id: string) {
  return request<SessionGitInfo>(`/api/sessions/${id}/git`);
}

export async function sendText(id: string, text: string, newline = true) {
  return request(`/api/sessions/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ text, newline }),
  });
}

export async function sendSignal(id: string, signal: string) {
  return request(`/api/sessions/${id}/signal`, {
    method: "POST",
    body: JSON.stringify({ signal }),
  });
}

export async function closeSession(id: string) {
  return request(`/api/sessions/${id}`, { method: "DELETE" });
}

// Processes
export async function listAgents() {
  return request<ProcessInfo[]>("/api/processes/agents");
}

// Control
export async function createTab(windowId?: string, profile?: string, command?: string) {
  return request<{ tab_id: string }>("/api/control/new-tab", {
    method: "POST",
    body: JSON.stringify({ window_id: windowId, profile, command }),
  });
}

export async function splitPane(
  sessionId: string,
  vertical = true,
  profile?: string,
  command?: string
) {
  return request<{ session_id: string }>("/api/control/split-pane", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      vertical,
      profile,
      command,
    }),
  });
}

export async function startAgent(
  agent: "claude" | "codex",
  workingDir?: string,
  prompt?: string
) {
  return request<{ session_id: string }>("/api/control/start-agent", {
    method: "POST",
    body: JSON.stringify({ agent, working_dir: workingDir, prompt }),
  });
}

// Layout
export async function getLayout() {
  return request<WindowInfo[]>("/api/layout/");
}

export async function listArrangements() {
  return request<{ arrangements: string[] }>("/api/layout/arrangements");
}

export async function saveArrangement(name: string) {
  return request(`/api/layout/arrangements/${name}/save`, { method: "POST" });
}

export async function restoreArrangement(name: string) {
  return request(`/api/layout/arrangements/${name}/restore`, { method: "POST" });
}

export async function listPresets() {
  return request<LayoutPreset[]>("/api/layout/presets");
}

export async function createPreset(preset: LayoutPreset) {
  return request<LayoutPreset>("/api/layout/presets", {
    method: "POST",
    body: JSON.stringify(preset),
  });
}

export async function applyPreset(name: string) {
  return request(`/api/layout/presets/${name}/apply`, { method: "POST" });
}
