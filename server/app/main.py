import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.iterm_bridge import ITermBridge
from app.routers import control, layout, processes, sessions, system
from app.websockets.streaming import router as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to iTerm2
    bridge = await ITermBridge.get_instance()
    try:
        await bridge.connect()
        logger.info("iTerm2 bridge connected")
    except Exception:
        logger.warning("iTerm2 not available — server will run in degraded mode")
    yield
    # Shutdown
    await bridge.disconnect()
    logger.info("iTerm2 bridge disconnected")


app = FastAPI(
    title="iTerm Agent Dashboard",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(sessions.router)
app.include_router(processes.router)
app.include_router(control.router)
app.include_router(layout.router)
app.include_router(ws_router)
