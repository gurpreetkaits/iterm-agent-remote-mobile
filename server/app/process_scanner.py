import asyncio
import logging
import re

import psutil

from app.models.process import ProcessInfo

logger = logging.getLogger(__name__)

# Patterns to detect agent processes
AGENT_PATTERNS = {
    "claude": re.compile(r"\bclaude\b", re.IGNORECASE),
    "codex": re.compile(r"\bcodex\b", re.IGNORECASE),
}


class ProcessScanner:
    """Scans OS processes to detect running Claude/Codex agents."""

    def _classify_agent(self, cmdline: list[str]) -> str | None:
        """Check if a process command line matches a known agent."""
        full_cmd = " ".join(cmdline)
        for agent_type, pattern in AGENT_PATTERNS.items():
            if pattern.search(full_cmd):
                return agent_type
        return None

    def _scan_sync(self, agents_only: bool = False) -> list[ProcessInfo]:
        """Synchronous scan — run in executor to avoid blocking."""
        results = []
        for proc in psutil.process_iter(
            ["pid", "name", "cmdline", "status", "create_time", "cwd"]
        ):
            try:
                info = proc.info
                cmdline = info.get("cmdline") or []
                if not cmdline:
                    continue

                agent_type = self._classify_agent(cmdline)
                if agents_only and agent_type is None:
                    continue

                # Get resource usage
                try:
                    cpu = proc.cpu_percent(interval=0)
                    mem = proc.memory_info().rss / (1024 * 1024)  # MB
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    cpu = 0.0
                    mem = 0.0

                results.append(
                    ProcessInfo(
                        pid=info["pid"],
                        name=info.get("name", ""),
                        cmdline=cmdline,
                        cpu_percent=cpu,
                        memory_mb=round(mem, 1),
                        status=info.get("status", "unknown"),
                        create_time=info.get("create_time", 0),
                        agent_type=agent_type,
                        working_directory=info.get("cwd"),
                    )
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return results

    async def scan_all(self) -> list[ProcessInfo]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._scan_sync, False)

    async def scan_agents(self) -> list[ProcessInfo]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._scan_sync, True)

    async def get_process(self, pid: int) -> ProcessInfo | None:
        try:
            proc = psutil.Process(pid)
            cmdline = proc.cmdline()
            agent_type = self._classify_agent(cmdline)
            try:
                cpu = proc.cpu_percent(interval=0)
                mem = proc.memory_info().rss / (1024 * 1024)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                cpu = 0.0
                mem = 0.0
            return ProcessInfo(
                pid=pid,
                name=proc.name(),
                cmdline=cmdline,
                cpu_percent=cpu,
                memory_mb=round(mem, 1),
                status=proc.status(),
                create_time=proc.create_time(),
                agent_type=agent_type,
                working_directory=proc.cwd(),
            )
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return None
