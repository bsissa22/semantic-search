"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";

interface User {
  username: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

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

  const handleCreateRoom = () => {
    const roomId = uuidv4().slice(0, 8);
    router.push(`/room/${roomId}?role=streamer`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.trim()}?role=viewer`);
    }
  };

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-medium tracking-tight opacity-50 mb-2 uppercase font-geist">
              ( Dashboard )
            </p>
            <h1 className="text-4xl md:text-5xl tracking-tighter font-light">
              Welcome, <span className="text-accent">{user.username}</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Room */}
            <GlassCard className="pb-8">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium tracking-tight mb-2">Go Live</h2>
                <p className="text-sm opacity-50 font-geist leading-relaxed">
                  Start streaming from your camera. Share the room code with viewers so they can watch your live stream.
                </p>
              </div>
              <button
                onClick={handleCreateRoom}
                className="w-full bg-bark text-cream py-3.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Room &amp; Stream
              </button>
            </GlassCard>

            {/* Join Room */}
            <GlassCard className="pb-8">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-2xl bg-bark/5 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium tracking-tight mb-2">Watch a Stream</h2>
                <p className="text-sm opacity-50 font-geist leading-relaxed">
                  Enter a room code to join as a viewer. Watch P2P streams directly from the streamer&apos;s browser.
                </p>
              </div>
              <form onSubmit={handleJoinRoom} className="flex gap-3">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Enter room code"
                  className="flex-1 bg-bark/5 border border-bark/10 rounded-xl px-4 py-3 text-sm placeholder:opacity-30 transition-colors focus:border-accent/30"
                />
                <button
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="bg-bark/10 text-bark px-6 py-3 rounded-xl text-sm font-medium transition-all hover:bg-bark/20 disabled:opacity-30 disabled:hover:bg-bark/10"
                >
                  Join
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Info Section */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 text-sm opacity-40 font-geist">
              <div className="w-8 h-[1px] bg-bark/20" />
              <span>All streams are direct. Your video never passes through any server.</span>
              <div className="w-8 h-[1px] bg-bark/20" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
