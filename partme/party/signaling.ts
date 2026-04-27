// PartyServer Signaling Backend for Cloudflare Workers
// This handles WebSocket signaling for WebRTC P2P connections.
// It only relays small text messages (offers, answers, ICE candidates).
// No video data ever passes through this server.

interface Env {
  // Durable Object bindings (if needed)
}

interface Room {
  streamer: WebSocket | null;
  streamerUsername: string;
  viewers: Map<string, WebSocket>;
}

const rooms: Map<string, Room> = new Map();

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      streamer: null,
      streamerUsername: "",
      viewers: new Map(),
    });
  }
  return rooms.get(roomId)!;
}

function broadcastToRoom(room: Room, message: object, exclude?: WebSocket) {
  const data = JSON.stringify(message);

  if (room.streamer && room.streamer !== exclude && room.streamer.readyState === 1) {
    room.streamer.send(data);
  }

  room.viewers.forEach((ws) => {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(data);
    }
  });
}

function handleWebSocket(ws: WebSocket, roomId: string) {
  const room = getOrCreateRoom(roomId);
  let username = "";
  let role = "";

  ws.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data as string);

      switch (msg.type) {
        case "join": {
          username = msg.username || "anonymous";
          role = msg.role || "viewer";

          if (role === "streamer") {
            room.streamer = ws;
            room.streamerUsername = username;
          } else {
            room.viewers.set(username, ws);
          }

          // Notify room about new participant
          broadcastToRoom(
            room,
            {
              type: "viewer-joined",
              username,
              viewerCount: room.viewers.size,
              role,
            },
            ws
          );

          // Send room info to the new participant
          ws.send(
            JSON.stringify({
              type: "room-info",
              streamer: room.streamerUsername,
              viewerCount: room.viewers.size,
              viewers: Array.from(room.viewers.keys()),
            })
          );
          break;
        }

        case "offer":
        case "answer":
        case "ice-candidate": {
          // Relay signaling messages to specific peer
          const target = msg.to;
          let targetWs: WebSocket | null = null;

          if (target === room.streamerUsername) {
            targetWs = room.streamer;
          } else {
            targetWs = room.viewers.get(target) || null;
          }

          if (targetWs && targetWs.readyState === 1) {
            targetWs.send(
              JSON.stringify({
                ...msg,
                from: username,
              })
            );
          }
          break;
        }

        case "stream-ended": {
          broadcastToRoom(room, { type: "stream-ended" }, ws);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to handle message:", err);
    }
  });

  ws.addEventListener("close", () => {
    if (role === "streamer") {
      room.streamer = null;
      room.streamerUsername = "";
      broadcastToRoom(room, { type: "stream-ended" });
    } else {
      room.viewers.delete(username);
      broadcastToRoom(room, {
        type: "viewer-left",
        username,
        viewerCount: room.viewers.size,
      });
    }

    // Clean up empty rooms
    if (!room.streamer && room.viewers.size === 0) {
      rooms.delete(roomId);
    }
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("room");

    // Handle CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      if (!roomId) {
        return new Response("Room ID required", { status: 400 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      server.accept();
      handleWebSocket(server, roomId);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          rooms: rooms.size,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response("Partme Signaling Server", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};
