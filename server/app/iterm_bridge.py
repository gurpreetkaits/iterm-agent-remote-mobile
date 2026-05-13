import asyncio
import logging

import iterm2

from app.models.session import GridSize, SessionInfo, TabInfo, WindowInfo

logger = logging.getLogger(__name__)

# Signal map for terminal control characters
SIGNALS = {
    "ctrl-c": "\x03",
    "ctrl-d": "\x04",
    "ctrl-z": "\x1a",
}


class ITermBridge:
    """Singleton bridge between FastAPI and the iTerm2 Python API.

    Uses Connection.async_create() to share uvicorn's asyncio event loop
    rather than creating a separate one.
    """

    _instance: "ITermBridge | None" = None
    _lock = asyncio.Lock()

    def __init__(self) -> None:
        self._connection: iterm2.Connection | None = None
        self._app: iterm2.App | None = None
        self._connected = False

    @classmethod
    async def get_instance(cls) -> "ITermBridge":
        async with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    @property
    def connected(self) -> bool:
        return self._connected

    async def connect(self) -> None:
        try:
            self._connection = await iterm2.Connection.async_create()
            self._app = await iterm2.async_get_app(self._connection)
            self._connected = True
            logger.info("Connected to iTerm2")
        except Exception:
            self._connected = False
            logger.exception("Failed to connect to iTerm2")
            raise

    async def disconnect(self) -> None:
        self._connected = False
        self._connection = None
        self._app = None

    async def _refresh(self) -> iterm2.App:
        if not self._app or not self._connection:
            raise RuntimeError("Not connected to iTerm2")
        await self._app.async_refresh()
        return self._app

    def _find_session(self, session_id: str) -> iterm2.Session:
        if not self._app:
            raise RuntimeError("Not connected to iTerm2")
        session = self._app.get_session_by_id(session_id)
        if session is None:
            raise ValueError(f"Session not found: {session_id}")
        return session

    # ── Session listing ──────────────────────────────────────────────

    async def list_windows(self) -> list[WindowInfo]:
        app = await self._refresh()
        windows = []
        for window in app.terminal_windows:
            tabs = []
            for tab in window.tabs:
                sessions = []
                for session in tab.sessions:
                    grid = session.grid_size
                    sessions.append(
                        SessionInfo(
                            session_id=session.session_id,
                            name=session.name or "",
                            tab_id=tab.tab_id,
                            window_id=window.window_id,
                            grid_size=GridSize(
                                width=grid.width, height=grid.height
                            ),
                        )
                    )
                tabs.append(
                    TabInfo(
                        tab_id=tab.tab_id,
                        window_id=window.window_id,
                        sessions=sessions,
                        active_session_id=(
                            tab.active_session_id
                            if hasattr(tab, "active_session_id")
                            else None
                        ),
                    )
                )
            windows.append(WindowInfo(window_id=window.window_id, tabs=tabs))
        return windows

    async def list_sessions(self) -> list[SessionInfo]:
        windows = await self.list_windows()
        sessions = []
        for window in windows:
            for tab in window.tabs:
                sessions.extend(tab.sessions)
        return sessions

    async def get_session(self, session_id: str) -> SessionInfo:
        sessions = await self.list_sessions()
        for s in sessions:
            if s.session_id == session_id:
                return s
        raise ValueError(f"Session not found: {session_id}")

    # ── Screen contents ──────────────────────────────────────────────

    async def get_screen_contents(
        self, session_id: str, lines: int = 100
    ) -> list[str]:
        session = self._find_session(session_id)
        contents = await session.async_get_screen_contents()
        result = []
        for i in range(contents.number_of_lines):
            line = contents.line(i)
            result.append(line.string)
        # Return last N lines
        return result[-lines:]

    async def get_screen_styled(
        self, session_id: str, lines: int = 100
    ) -> list[list[dict]]:
        from app.services.screen_styles import extract_styled_lines

        session = self._find_session(session_id)
        contents = await session.async_get_screen_contents()
        styled = extract_styled_lines(contents)
        return styled[-lines:]

    async def get_screen_styled_with_cursor(
        self, session_id: str, lines: int = 100
    ) -> dict:
        from app.services.screen_styles import extract_styled_lines

        session = self._find_session(session_id)
        contents = await session.async_get_screen_contents()
        all_lines = extract_styled_lines(contents)
        sliced = all_lines[-lines:]
        try:
            cur = contents.cursor_coord
            top_y = contents.windowed_coord_range.coord_range.start.y
            offset = max(0, len(all_lines) - len(sliced))
            rel_y = cur.y - top_y - offset
            cursor = {"x": int(cur.x), "y": int(rel_y)}
        except Exception:
            cursor = None
        return {"lines": sliced, "cursor": cursor}

    # ── Send text / signals ──────────────────────────────────────────

    async def send_text(
        self, session_id: str, text: str, newline: bool = True
    ) -> None:
        session = self._find_session(session_id)
        payload = text + ("\n" if newline else "")
        await session.async_send_text(payload)

    async def send_signal(self, session_id: str, signal: str) -> None:
        char = SIGNALS.get(signal)
        if char is None:
            raise ValueError(f"Unknown signal: {signal}. Use: {list(SIGNALS)}")
        session = self._find_session(session_id)
        await session.async_send_text(char)

    async def get_session_cwd(self, session_id: str) -> str | None:
        """Read the iTerm2 'path' variable (set via shell integration)."""
        session = self._find_session(session_id)
        for var in ("path", "pwd"):
            try:
                value = await session.async_get_variable(var)
            except Exception:
                value = None
            if value:
                return str(value)
        return None

    # ── Tab / pane management ────────────────────────────────────────

    async def create_tab(
        self,
        window_id: str | None = None,
        profile: str | None = None,
        command: str | None = None,
    ) -> str:
        app = await self._refresh()
        if window_id:
            window = app.get_window_by_id(window_id)
            if window is None:
                raise ValueError(f"Window not found: {window_id}")
        else:
            window = app.current_terminal_window
            if window is None:
                raise ValueError("No current window")

        tab = await window.async_create_tab(profile=profile, command=command)
        return tab.tab_id

    async def split_pane(
        self,
        session_id: str,
        vertical: bool = True,
        profile: str | None = None,
        command: str | None = None,
    ) -> str:
        session = self._find_session(session_id)
        new_session = await session.async_split_pane(
            vertical=vertical, profile=profile, command=command
        )
        return new_session.session_id

    async def create_window(
        self,
        profile: str | None = None,
        command: str | None = None,
    ) -> str:
        if not self._connection:
            raise RuntimeError("Not connected to iTerm2")
        window = await iterm2.Window.async_create(
            self._connection, profile=profile, command=command
        )
        return window.window_id

    async def close_session(self, session_id: str) -> None:
        session = self._find_session(session_id)
        await session.async_close()

    # ── Layout arrangements ──────────────────────────────────────────

    async def list_arrangements(self) -> list[str]:
        if not self._connection:
            raise RuntimeError("Not connected to iTerm2")
        return await iterm2.Arrangement.async_list(self._connection)

    async def save_arrangement(self, name: str) -> None:
        if not self._connection:
            raise RuntimeError("Not connected to iTerm2")
        await iterm2.Arrangement.async_save(self._connection, name)

    async def restore_arrangement(self, name: str) -> None:
        if not self._connection:
            raise RuntimeError("Not connected to iTerm2")
        await iterm2.Arrangement.async_restore(self._connection, name)

    # ── Agent session helpers ────────────────────────────────────────

    async def start_agent_session(
        self,
        agent: str,
        working_dir: str | None = None,
        prompt: str | None = None,
    ) -> str:
        """Start a new Claude or Codex session in a new tab."""
        app = await self._refresh()
        window = app.current_terminal_window
        if window is None:
            raise ValueError("No current window")

        # Build the command
        if agent == "claude":
            cmd = "claude"
            if prompt:
                cmd += f" '{prompt}'"
        elif agent == "codex":
            cmd = "codex"
            if prompt:
                cmd += f" '{prompt}'"
        else:
            raise ValueError(f"Unknown agent: {agent}. Use 'claude' or 'codex'")

        # Prepend cd if working_dir specified
        if working_dir:
            cmd = f"cd {working_dir} && {cmd}"

        tab = await window.async_create_tab()
        session = tab.current_session
        await session.async_send_text(cmd + "\n")
        return session.session_id

    # ── Screen streaming (for WebSocket) ─────────────────────────────

    async def stream_screen(
        self, session_id: str, callback, stop_event: asyncio.Event
    ) -> None:
        """Stream screen updates for a session. Calls callback(lines) on each change."""
        session = self._find_session(session_id)
        if not self._connection:
            raise RuntimeError("Not connected to iTerm2")

        from app.services.screen_styles import extract_styled_lines

        async with session.get_screen_streamer(want_contents=True) as streamer:
            while not stop_event.is_set():
                try:
                    contents = await asyncio.wait_for(
                        streamer.async_get(), timeout=10.0
                    )
                    if contents:
                        lines = extract_styled_lines(contents)
                        try:
                            cur = contents.cursor_coord
                            top_y = contents.windowed_coord_range.coord_range.start.y
                            cursor = {"x": int(cur.x), "y": int(cur.y - top_y)}
                        except Exception:
                            cursor = None
                        await callback({"lines": lines, "cursor": cursor})
                except asyncio.TimeoutError:
                    # Send heartbeat
                    await callback(None)
                except Exception:
                    logger.exception("Screen streaming error")
                    break
