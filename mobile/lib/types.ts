export interface GridSize {
  width: number;
  height: number;
}

export interface SessionInfo {
  session_id: string;
  name: string;
  tab_id: string;
  window_id: string;
  grid_size: GridSize;
  is_agent: boolean;
  agent_type: string | null;
  foreground_pid: number | null;
}

export interface WindowInfo {
  window_id: string;
  tabs: TabInfo[];
}

export interface TabInfo {
  tab_id: string;
  window_id: string;
  sessions: SessionInfo[];
  active_session_id: string | null;
}

export interface ScreenOutput {
  session_id: string;
  lines: string[];
  cursor_x: number;
  cursor_y: number;
}

/** Compact styled run. f=fg hex, b=bg hex, fl=bitflags (1=bold, 2=italic, 4=underline, 8=inverse). */
export interface StyledRun {
  t: string;
  f?: string;
  b?: string;
  fl?: number;
}

export type StyledLine = StyledRun[];

export interface SystemInfo {
  hostname: string;
  platform: string;
  python_version: string;
  iterm_connected: boolean;
  uptime_seconds: number;
  host_uptime_seconds: number;
  cpu_percent: number;
  cpu_count: number;
  memory_total: number;
  memory_used: number;
  memory_percent: number;
}

export interface SessionGitInfo {
  cwd: string | null;
  is_repo: boolean;
  branch: string | null;
  worktree: string | null;
  is_worktree: boolean;
  changed_files: number;
  insertions: number;
  deletions: number;
  untracked: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cmdline: string[];
  cpu_percent: number;
  memory_mb: number;
  status: string;
  create_time: number;
  session_id: string | null;
  agent_type: string | null;
  working_directory: string | null;
}

export interface LayoutPreset {
  name: string;
  description: string;
  panes: PaneConfig[];
}

export interface PaneConfig {
  command: string | null;
  profile: string | null;
  split: string | null;
}

export interface DashboardData {
  type: "dashboard";
  sessions: SessionInfo[];
  agents: ProcessInfo[];
  iterm_connected: boolean;
  timestamp: number;
}

export interface Cursor {
  x: number;
  y: number;
}

export interface ScreenData {
  type: "screen";
  session_id: string;
  lines: StyledLine[];
  cursor?: Cursor | null;
  timestamp: number;
}

export type WSMessage = DashboardData | ScreenData | { type: "heartbeat" };
