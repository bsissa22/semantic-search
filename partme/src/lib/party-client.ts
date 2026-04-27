// PartySocket client for connecting to the Cloudflare PartyServer signaling backend.
// Since the PartyServer might not be deployed yet, we provide a fallback
// that uses a simple WebSocket or the built-in Next.js API routes for signaling.

export type SignalMessage =
  | { type: "join"; role: "streamer" | "viewer"; username: string }
  | { type: "offer"; sdp: RTCSessionDescriptionInit; from: string }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; from: string; to: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; from: string; to: string }
  | { type: "viewer-joined"; username: string; viewerCount: number }
  | { type: "viewer-left"; username: string; viewerCount: number }
  | { type: "room-info"; streamer: string; viewerCount: number; viewers: string[] }
  | { type: "stream-ended" }
  | { type: "error"; message: string };

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, ((msg: SignalMessage) => void)[]> = new Map();
  private roomId: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  connect(): void {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws?room=${this.roomId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[Signaling] Connected to room:", this.roomId);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: SignalMessage = JSON.parse(event.data);
        const handlers = this.handlers.get(msg.type) || [];
        handlers.forEach((h) => h(msg));

        // Also fire "all" handlers
        const allHandlers = this.handlers.get("*") || [];
        allHandlers.forEach((h) => h(msg));
      } catch (err) {
        console.error("[Signaling] Failed to parse message:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("[Signaling] Disconnected. Reconnecting in 3s...");
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error("[Signaling] WebSocket error:", err);
    };
  }

  send(msg: SignalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(type: string, handler: (msg: SignalMessage) => void): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler: (msg: SignalMessage) => void): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      this.handlers.set(
        type,
        handlers.filter((h) => h !== handler)
      );
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
