"use client";

interface StreamControlsProps {
  isStreaming: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleStream: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndStream: () => void;
}

export default function StreamControls({
  isStreaming,
  isMuted,
  isVideoOff,
  onToggleStream,
  onToggleMute,
  onToggleVideo,
  onEndStream,
}: StreamControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Mute Toggle */}
      <button
        onClick={onToggleMute}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isMuted
            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            : "bg-bark/10 text-bark hover:bg-bark/20"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Go Live / End Stream */}
      {!isStreaming ? (
        <button
          onClick={onToggleStream}
          className="h-12 px-8 bg-accent text-white rounded-full font-medium text-sm hover:scale-105 transition-transform animate-pulse-glow"
        >
          Go Live
        </button>
      ) : (
        <button
          onClick={onEndStream}
          className="h-12 px-8 bg-red-500 text-white rounded-full font-medium text-sm hover:scale-105 transition-transform"
        >
          End Stream
        </button>
      )}

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isVideoOff
            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            : "bg-bark/10 text-bark hover:bg-bark/20"
        }`}
        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
      >
        {isVideoOff ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
