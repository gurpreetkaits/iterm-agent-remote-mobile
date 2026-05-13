from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.models.process import ProcessInfo
from app.process_scanner import ProcessScanner

router = APIRouter(
    prefix="/api/processes",
    tags=["processes"],
    dependencies=[Depends(verify_token)],
)

scanner = ProcessScanner()


@router.get("/", response_model=list[ProcessInfo])
async def list_processes():
    return await scanner.scan_all()


@router.get("/agents", response_model=list[ProcessInfo])
async def list_agents():
    return await scanner.scan_agents()


@router.get("/{pid}", response_model=ProcessInfo)
async def get_process(pid: int):
    proc = await scanner.get_process(pid)
    if proc is None:
        raise HTTPException(status_code=404, detail=f"Process {pid} not found")
    return proc
