import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.iterm_bridge import ITermBridge
from app.models.layout import LayoutPreset

router = APIRouter(
    prefix="/api/layout",
    tags=["layout"],
    dependencies=[Depends(verify_token)],
)

PRESETS_FILE = Path(__file__).parent.parent / "presets.json"


def _load_presets() -> list[LayoutPreset]:
    if PRESETS_FILE.exists():
        data = json.loads(PRESETS_FILE.read_text())
        return [LayoutPreset(**p) for p in data]
    return []


def _save_presets(presets: list[LayoutPreset]) -> None:
    PRESETS_FILE.write_text(
        json.dumps([p.model_dump() for p in presets], indent=2)
    )


@router.get("/")
async def get_layout():
    bridge = await ITermBridge.get_instance()
    windows = await bridge.list_windows()
    return [w.model_dump() for w in windows]


@router.get("/arrangements")
async def list_arrangements():
    bridge = await ITermBridge.get_instance()
    try:
        names = await bridge.list_arrangements()
        return {"arrangements": names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/arrangements/{name}/save")
async def save_arrangement(name: str):
    bridge = await ITermBridge.get_instance()
    try:
        await bridge.save_arrangement(name)
        return {"status": "saved", "name": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/arrangements/{name}/restore")
async def restore_arrangement(name: str):
    bridge = await ITermBridge.get_instance()
    try:
        await bridge.restore_arrangement(name)
        return {"status": "restored", "name": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/presets", response_model=list[LayoutPreset])
async def list_presets():
    return _load_presets()


@router.post("/presets", response_model=LayoutPreset)
async def create_preset(preset: LayoutPreset):
    presets = _load_presets()
    # Replace if exists
    presets = [p for p in presets if p.name != preset.name]
    presets.append(preset)
    _save_presets(presets)
    return preset


@router.post("/presets/{name}/apply")
async def apply_preset(name: str):
    presets = _load_presets()
    preset = next((p for p in presets if p.name == name), None)
    if preset is None:
        raise HTTPException(status_code=404, detail=f"Preset not found: {name}")

    bridge = await ITermBridge.get_instance()
    # Apply preset by creating tabs/panes
    for pane_config in preset.panes:
        if pane_config.split == "vertical":
            sessions = await bridge.list_sessions()
            if sessions:
                await bridge.split_pane(
                    sessions[-1].session_id,
                    vertical=True,
                    profile=pane_config.profile,
                    command=pane_config.command,
                )
        elif pane_config.split == "horizontal":
            sessions = await bridge.list_sessions()
            if sessions:
                await bridge.split_pane(
                    sessions[-1].session_id,
                    vertical=False,
                    profile=pane_config.profile,
                    command=pane_config.command,
                )
        else:
            await bridge.create_tab(
                profile=pane_config.profile,
                command=pane_config.command,
            )

    return {"status": "applied", "name": name}
