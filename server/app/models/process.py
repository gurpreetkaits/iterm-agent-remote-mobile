from pydantic import BaseModel


class ProcessInfo(BaseModel):
    pid: int
    name: str
    cmdline: list[str]
    cpu_percent: float
    memory_mb: float
    status: str
    create_time: float
    session_id: str | None = None
    agent_type: str | None = None
    working_directory: str | None = None
