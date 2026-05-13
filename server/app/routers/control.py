from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.iterm_bridge import ITermBridge
from app.models.layout import NewTabRequest, SplitPaneRequest, StartAgentRequest

router = APIRouter(
    prefix="/api/control",
    tags=["control"],
    dependencies=[Depends(verify_token)],
)


@router.post("/new-tab")
async def create_tab(req: NewTabRequest):
    bridge = await ITermBridge.get_instance()
    try:
        tab_id = await bridge.create_tab(
            window_id=req.window_id,
            profile=req.profile,
            command=req.command,
        )
        return {"tab_id": tab_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/split-pane")
async def split_pane(req: SplitPaneRequest):
    bridge = await ITermBridge.get_instance()
    try:
        session_id = await bridge.split_pane(
            session_id=req.session_id,
            vertical=req.vertical,
            profile=req.profile,
            command=req.command,
        )
        return {"session_id": session_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/new-window")
async def create_window(
    profile: str | None = None,
    command: str | None = None,
):
    bridge = await ITermBridge.get_instance()
    try:
        window_id = await bridge.create_window(profile=profile, command=command)
        return {"window_id": window_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/start-agent")
async def start_agent(req: StartAgentRequest):
    bridge = await ITermBridge.get_instance()
    try:
        session_id = await bridge.start_agent_session(
            agent=req.agent,
            working_dir=req.working_dir,
            prompt=req.prompt,
        )
        return {"session_id": session_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
