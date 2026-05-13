import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, key: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if key not in self._connections:
            self._connections[key] = []
        self._connections[key].append(websocket)
        logger.info(f"WS connected: {key} (total: {len(self._connections[key])})")

    def disconnect(self, key: str, websocket: WebSocket) -> None:
        if key in self._connections:
            self._connections[key] = [
                ws for ws in self._connections[key] if ws is not websocket
            ]
            if not self._connections[key]:
                del self._connections[key]
        logger.info(f"WS disconnected: {key}")

    async def broadcast(self, key: str, data: dict) -> None:
        if key not in self._connections:
            return
        dead = []
        for ws in self._connections[key]:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(key, ws)


manager = ConnectionManager()
