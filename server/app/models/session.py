from pydantic import BaseModel


class GridSize(BaseModel):
    width: int
    height: int


class SessionInfo(BaseModel):
    session_id: str
    name: str
    tab_id: str
    window_id: str
    grid_size: GridSize
    is_agent: bool = False
    agent_type: str | None = None
    foreground_pid: int | None = None


class TabInfo(BaseModel):
    tab_id: str
    window_id: str
    sessions: list[SessionInfo]
    active_session_id: str | None = None


class WindowInfo(BaseModel):
    window_id: str
    tabs: list[TabInfo]


class ScreenOutput(BaseModel):
    session_id: str
    lines: list[str]
    cursor_x: int = 0
    cursor_y: int = 0


class SendTextRequest(BaseModel):
    text: str
    newline: bool = True


class SignalRequest(BaseModel):
    signal: str  # "ctrl-c", "ctrl-d", "ctrl-z"


class SessionGitInfo(BaseModel):
    cwd: str | None = None
    is_repo: bool = False
    branch: str | None = None
    worktree: str | None = None
    is_worktree: bool = False
    changed_files: int = 0
    insertions: int = 0
    deletions: int = 0
    untracked: int = 0
