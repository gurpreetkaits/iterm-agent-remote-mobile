import asyncio
import logging
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.auth import verify_ws_token
from app.iterm_bridge import ITermBridge
from app.process_scanner import ProcessScanner
from app.websockets.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()

scanner = ProcessScanner()


@router.websocket("/ws/session/{session_id}/output")
async def session_output(websocket: WebSocket, session_id: str, token: str = ""):
    if not verify_ws_token(token):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await manager.connect(f"session:{session_id}", websocket)
    bridge = await ITermBridge.get_instance()
    stop_event = asyncio.Event()

    async def on_screen_update(lines):
        try:
            if lines is not None:
                await websocket.send_json({
                    "type": "screen",
                    "session_id": session_id,
                    "lines": lines,
                    "timestamp": time.time(),
                })
            else:
                await websocket.send_json({"type": "heartbeat"})
        except Exception:
            stop_event.set()

    try:
        # Send initial screen contents (styled)
        try:
            initial = await bridge.get_screen_styled(session_id)
            await websocket.send_json({
                "type": "screen",
                "session_id": session_id,
                "lines": initial,
                "timestamp": time.time(),
            })
        except Exception:
            pass

        # Start streaming in background
        stream_task = asyncio.create_task(
            bridge.stream_screen(session_id, on_screen_update, stop_event)
        )

        # Keep connection alive, listen for client messages
        try:
            while True:
                data = await websocket.receive_text()
                # Client can send commands through the WebSocket too
                if data:
                    import json
                    msg = json.loads(data)
                    if msg.get("type") == "send":
                        await bridge.send_text(
                            session_id, msg.get("text", ""), msg.get("newline", True)
                        )
        except WebSocketDisconnect:
            pass
        finally:
            stop_event.set()
            stream_task.cancel()
            try:
                await stream_task
            except asyncio.CancelledError:
                pass
    finally:
        manager.disconnect(f"session:{session_id}", websocket)


@router.websocket("/ws/dashboard")
async def dashboard_feed(websocket: WebSocket, token: str = ""):
    if not verify_ws_token(token):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await manager.connect("dashboard", websocket)
    try:
        while True:
            bridge = await ITermBridge.get_instance()
            try:
                sessions = await bridge.list_sessions()
                agents = await scanner.scan_agents()
                await websocket.send_json({
                    "type": "dashboard",
                    "sessions": [s.model_dump() for s in sessions],
                    "agents": [a.model_dump() for a in agents],
                    "iterm_connected": bridge.connected,
                    "timestamp": time.time(),
                })
            except Exception:
                await websocket.send_json({
                    "type": "dashboard",
                    "sessions": [],
                    "agents": [],
                    "iterm_connected": False,
                    "timestamp": time.time(),
                })
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect("dashboard", websocket)
