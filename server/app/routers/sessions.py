from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.iterm_bridge import ITermBridge
from app.models.session import (
    ScreenOutput,
    SendTextRequest,
    SessionGitInfo,
    SessionInfo,
    SignalRequest,
    WindowInfo,
)
from app.services.git_info import get_git_info

router = APIRouter(
    prefix="/api/sessions",
    tags=["sessions"],
    dependencies=[Depends(verify_token)],
)


@router.get("/", response_model=list[SessionInfo])
async def list_sessions():
    bridge = await ITermBridge.get_instance()
    return await bridge.list_sessions()


@router.get("/windows", response_model=list[WindowInfo])
async def list_windows():
    bridge = await ITermBridge.get_instance()
    return await bridge.list_windows()


@router.get("/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    bridge = await ITermBridge.get_instance()
    try:
        return await bridge.get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{session_id}/screen", response_model=ScreenOutput)
async def get_screen(session_id: str, lines: int = 100):
    bridge = await ITermBridge.get_instance()
    try:
        content = await bridge.get_screen_contents(session_id, lines)
        return ScreenOutput(session_id=session_id, lines=content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{session_id}/send")
async def send_text(session_id: str, req: SendTextRequest):
    bridge = await ITermBridge.get_instance()
    try:
        await bridge.send_text(session_id, req.text, req.newline)
        return {"status": "sent"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{session_id}/signal")
async def send_signal(session_id: str, req: SignalRequest):
    bridge = await ITermBridge.get_instance()
    try:
        await bridge.send_signal(session_id, req.signal)
        return {"status": "sent"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{session_id}/git", response_model=SessionGitInfo)
async def get_session_git(session_id: str):
    bridge = await ITermBridge.get_instance()
    try:
        cwd = await bridge.get_session_cwd(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not cwd:
        return SessionGitInfo(cwd=None, is_repo=False)
    info = await get_git_info(cwd)
    return SessionGitInfo(
        cwd=info.cwd,
        is_repo=info.is_repo,
        branch=info.branch,
        worktree=info.worktree,
        is_worktree=info.is_worktree,
        changed_files=info.changed_files,
        insertions=info.insertions,
        deletions=info.deletions,
        untracked=info.untracked,
    )


@router.delete("/{session_id}")
async def close_session(session_id: str):
    bridge = await ITermBridge.get_instance()
    try:
        await bridge.close_session(session_id)
        return {"status": "closed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
