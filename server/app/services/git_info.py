import asyncio
import os
from dataclasses import dataclass


@dataclass
class GitInfo:
    cwd: str
    is_repo: bool
    branch: str | None = None
    worktree: str | None = None
    is_worktree: bool = False
    changed_files: int = 0
    insertions: int = 0
    deletions: int = 0
    untracked: int = 0


async def _run(cwd: str, *args: str) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        "git",
        "-C",
        cwd,
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )
    out, _ = await proc.communicate()
    return proc.returncode or 0, out.decode(errors="replace").strip()


def _parse_shortstat(line: str) -> tuple[int, int, int]:
    files = insertions = deletions = 0
    for chunk in line.split(","):
        chunk = chunk.strip()
        if "file" in chunk:
            files = int(chunk.split()[0])
        elif "insertion" in chunk:
            insertions = int(chunk.split()[0])
        elif "deletion" in chunk:
            deletions = int(chunk.split()[0])
    return files, insertions, deletions


async def get_git_info(cwd: str) -> GitInfo:
    info = GitInfo(cwd=cwd, is_repo=False)
    if not cwd or not os.path.isdir(cwd):
        return info

    rc, toplevel = await _run(cwd, "rev-parse", "--show-toplevel")
    if rc != 0 or not toplevel:
        return info
    info.is_repo = True
    info.worktree = os.path.basename(toplevel)

    _, git_dir = await _run(cwd, "rev-parse", "--git-dir")
    _, common_dir = await _run(cwd, "rev-parse", "--git-common-dir")
    if git_dir and common_dir:
        info.is_worktree = os.path.realpath(git_dir) != os.path.realpath(common_dir)

    rc, branch = await _run(cwd, "rev-parse", "--abbrev-ref", "HEAD")
    if rc == 0 and branch:
        info.branch = branch if branch != "HEAD" else None
        if info.branch is None:
            _, short = await _run(cwd, "rev-parse", "--short", "HEAD")
            info.branch = f"detached@{short}" if short else "detached"

    _, shortstat = await _run(cwd, "diff", "--shortstat", "HEAD")
    files, ins, dels = _parse_shortstat(shortstat)
    info.changed_files = files
    info.insertions = ins
    info.deletions = dels

    _, untracked_out = await _run(
        cwd, "ls-files", "--others", "--exclude-standard"
    )
    info.untracked = len([l for l in untracked_out.splitlines() if l.strip()])

    return info
