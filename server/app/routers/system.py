import platform
import time

from fastapi import APIRouter

from app.iterm_bridge import ITermBridge

router = APIRouter(prefix="/api/system", tags=["system"])

_start_time = time.time()


@router.get("/health")
async def health():
    bridge = await ITermBridge.get_instance()
    return {
        "status": "ok",
        "iterm_connected": bridge.connected,
        "uptime_seconds": int(time.time() - _start_time),
    }


@router.get("/info")
async def info():
    bridge = await ITermBridge.get_instance()
    return {
        "hostname": platform.node(),
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "iterm_connected": bridge.connected,
        "uptime_seconds": int(time.time() - _start_time),
    }
