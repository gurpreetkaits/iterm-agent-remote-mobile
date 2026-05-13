import { useStore } from "../store/useStore";
import type { WSMessage } from "./types";

type MessageHandler = (msg: WSMessage) => void;

export class DashboardWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private shouldReconnect = true;
  private url: string;
  private onMessage: MessageHandler;

  constructor(path: string, onMessage: MessageHandler) {
    const { serverUrl, token } = useStore.getState();
    const wsUrl = (serverUrl || "")
      .replace(/^http/, "ws")
      .replace(/\/$/, "");
    this.url = `${wsUrl}${path}?token=${token}`;
    this.onMessage = onMessage;
  }

  connect(): void {
    if (this.ws) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          this.onMessage(msg);
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
  }

  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
