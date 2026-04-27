"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  isLive?: boolean;
  className?: string;
}

export default function VideoPlayer({
  stream,
  muted = false,
  label,
  isLive = false,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-container group ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Label & Live indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        {isLive && (
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full live-dot" />
            LIVE
          </span>
        )}
        {label && (
          <span className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
            {label}
          </span>
        )}
      </div>

      {/* No stream placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-bark/5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bark/10 flex items-center justify-center">
              <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm opacity-40">Waiting for stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}
