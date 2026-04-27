"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import StreamControls from "@/components/StreamControls";
import ViewerList from "@/components/ViewerList";
import {
  createPeerConnection,
  createOffer,
  createAnswer,
  handleAnswer,
  addIceCandidate,
  getMediaStream,
} from "@/lib/webrtc";

interface SignalMessage {
  type: string;
  [key: string]: unknown;
}

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;
  const role = searchParams.get("role") || "viewer";

  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewers, setViewers] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem("partme-user");
    if (!stored) {
      router.push("/auth/login");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  // Send signaling message
  const sendSignal = useCallback((msg: SignalMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Create peer connection for a specific remote peer
  const createPC = useCallback(
    (peerId: string, isInitiator: boolean) => {
      const pc = createPeerConnection(
        // On ICE candidate
        (candidate) => {
          sendSignal({
            type: "ice-candidate",
            candidate: candidate.toJSON(),
            to: peerId,
          });
        },
        // On remote track (for viewers)
        (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            setStatus("Watching live stream");
          }
        }
      );

      // If we're the streamer, add our local tracks
      if (role === "streamer" && localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      peerConnectionsRef.current.set(peerId, pc);

      // If initiator, create and send offer
      if (isInitiator) {
        createOffer(pc).then((offer) => {
          sendSignal({
            type: "offer",
            sdp: offer,
            to: peerId,
          });
        });
      }

      return pc;
    },
    [role, sendSignal]
  );

  // Connect to signaling via WebSocket
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Connect to the Cloudflare Worker signaling server via WebSocket
    const connectSignaling = () => {
      setStatus(role === "streamer" ? "Ready to stream" : "Connecting to room...");

      const partyHost = process.env.NEXT_PUBLIC_PARTY_HOST || "partme-signaling.louatimahdi390.workers.dev";
      const wsUrl = `wss://${partyHost}?room=${roomId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus(role === "streamer" ? "Ready to stream" : "Connected to room");
        // Send join message once connected
        sendSignal({
          type: "join",
          role,
          username: user!.username,
          roomId,
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as SignalMessage;
          handleSignalMessage(msg);
        } catch (err) {
          console.error("[Signaling] Failed to parse:", err);
        }
      };

      ws.onclose = () => {
        setStatus("Disconnected. Reconnecting...");
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (wsRef.current === ws) {
            connectSignaling();
          }
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error("[Signaling] WebSocket error:", err);
      };

      return () => {
        ws.close();
      };
    };

    const cleanup = connectSignaling();

    return () => {
      cleanup?.();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId, role]);

  // Handle incoming signaling messages
  const handleSignalMessage = useCallback(
    async (msg: SignalMessage) => {
      const from = msg.from as string;

      switch (msg.type) {
        case "join": {
          if (role === "streamer" && msg.role === "viewer" && from) {
            // New viewer joined - create PC and send offer
            createPC(from, true);
            setViewers((prev) => [...new Set([...prev, msg.username as string])]);
            setViewerCount((prev) => prev + 1);
          }
          break;
        }

        case "offer": {
          if (role === "viewer" && msg.to === user?.username) {
            // Received offer from streamer
            const pc = createPC(from, false);
            const answer = await createAnswer(
              pc,
              msg.sdp as RTCSessionDescriptionInit
            );
            sendSignal({
              type: "answer",
              sdp: answer,
              to: from,
              from: user?.username,
            });
          }
          break;
        }

        case "answer": {
          if (role === "streamer" && msg.to === user?.username) {
            const pc = peerConnectionsRef.current.get(from);
            if (pc) {
              await handleAnswer(pc, msg.sdp as RTCSessionDescriptionInit);
            }
          }
          break;
        }

        case "ice-candidate": {
          if (msg.to === user?.username) {
            const pc = peerConnectionsRef.current.get(from);
            if (pc) {
              await addIceCandidate(
                pc,
                msg.candidate as RTCIceCandidateInit
              );
            }
          }
          break;
        }

        case "viewer-left": {
          setViewers((prev) =>
            prev.filter((v) => v !== (msg.username as string))
          );
          setViewerCount((prev) => Math.max(0, prev - 1));
          const pc = peerConnectionsRef.current.get(from);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(from);
          }
          break;
        }

        case "stream-ended": {
          setRemoteStream(null);
          setStatus("Stream ended");
          peerConnectionsRef.current.forEach((pc) => pc.close());
          peerConnectionsRef.current.clear();
          break;
        }
      }
    },
    [role, user, createPC, sendSignal]
  );

  // Start streaming
  const handleStartStream = async () => {
    try {
      const stream = await getMediaStream(true, true);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsStreaming(true);
      setStatus("You are live!");
    } catch (err) {
      console.error("Failed to get media:", err);
      setStatus("Camera access denied");
    }
  };

  // End streaming
  const handleEndStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    localStreamRef.current = null;
    setLocalStream(null);
    setIsStreaming(false);
    setStatus("Stream ended");

    sendSignal({ type: "stream-ended", from: user?.username });

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  // Copy room code
  const handleCopyRoomCode = () => {
    const url = `${window.location.origin}/room/${roomId}?role=viewer`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Room Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-light tracking-tight">
                Room: <span className="text-accent font-medium">{roomId}</span>
              </h1>
              {isStreaming && (
                <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full live-dot" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm opacity-50 font-geist">{status}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyRoomCode}
              className="inline-flex items-center gap-2 bg-bark/5 hover:bg-bark/10 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "Copied!" : "Share Room Link"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Area */}
          <div className="lg:col-span-3 space-y-4">
            {role === "streamer" ? (
              <VideoPlayer
                stream={localStream}
                muted={true}
                label={user.username}
                isLive={isStreaming}
                className="w-full"
              />
            ) : (
              <VideoPlayer
                stream={remoteStream}
                label="Live Stream"
                isLive={!!remoteStream}
                className="w-full"
              />
            )}

            {/* Controls (streamer only) */}
            {role === "streamer" && (
              <div className="card-flashlight p-4">
                <div className="relative z-10">
                  <StreamControls
                    isStreaming={isStreaming}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    onToggleStream={handleStartStream}
                    onToggleMute={handleToggleMute}
                    onToggleVideo={handleToggleVideo}
                    onEndStream={handleEndStream}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Room Info */}
            <div className="card-flashlight p-4">
              <div className="relative z-10">
                <h3 className="text-sm font-medium opacity-60 mb-3">Room Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-40 font-geist">Role</span>
                    <span className="font-medium capitalize">{role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40 font-geist">Connection</span>
                    <span className="font-medium">Direct P2P</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40 font-geist">Quality</span>
                    <span className="font-medium text-xs">HD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewer List */}
            <ViewerList viewers={viewers} viewerCount={viewerCount} />

            {/* Connection Quality */}
            <div className="card-flashlight p-4">
              <div className="relative z-10">
                <h3 className="text-sm font-medium opacity-60 mb-3">Connection</h3>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1 rounded-full ${
                          bar <= 3 ? "bg-green-500" : "bg-bark/10"
                        }`}
                        style={{ height: `${bar * 4 + 4}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs opacity-50 font-geist">
                    {isStreaming || remoteStream ? "Good" : "Waiting"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm opacity-50 font-geist">Loading room...</p>
            </div>
          </div>
        }
      >
        <RoomContent />
      </Suspense>
    </>
  );
}
