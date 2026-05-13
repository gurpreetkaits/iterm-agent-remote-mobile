import platform
import time

import psutil
from fastapi import APIRouter

from app.iterm_bridge import ITermBridge

router = APIRouter(prefix="/api/system", tags=["system"])

_start_time = time.time()
# Prime cpu_percent — first call is always 0
psutil.cpu_percent(interval=None)


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
    mem = psutil.virtual_memory()
    return {
        "hostname": platform.node(),
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "iterm_connected": bridge.connected,
        "uptime_seconds": int(time.time() - _start_time),
        "host_uptime_seconds": int(time.time() - psutil.boot_time()),
        "cpu_percent": psutil.cpu_percent(interval=None),
        "cpu_count": psutil.cpu_count(logical=True),
        "memory_total": mem.total,
        "memory_used": mem.used,
        "memory_percent": mem.percent,
    }
