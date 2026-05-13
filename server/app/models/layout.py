from pydantic import BaseModel


class PaneConfig(BaseModel):
    command: str | None = None
    profile: str | None = None
    split: str | None = None  # "vertical" | "horizontal"


class LayoutPreset(BaseModel):
    name: str
    description: str
    panes: list[PaneConfig]


class NewTabRequest(BaseModel):
    window_id: str | None = None
    profile: str | None = None
    command: str | None = None


class SplitPaneRequest(BaseModel):
    session_id: str
    vertical: bool = True
    profile: str | None = None
    command: str | None = None


class StartAgentRequest(BaseModel):
    agent: str  # "claude" | "codex"
    working_dir: str | None = None
    prompt: str | None = None
