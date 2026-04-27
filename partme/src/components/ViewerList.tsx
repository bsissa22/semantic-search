"use client";

interface ViewerListProps {
  viewers: string[];
  viewerCount: number;
}

export default function ViewerList({ viewers, viewerCount }: ViewerListProps) {
  return (
    <div className="card-flashlight p-4">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium opacity-60">Viewers</h3>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full live-dot" />
            {viewerCount}
          </span>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {viewers.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-4">No viewers yet</p>
          ) : (
            viewers.map((viewer) => (
              <div
                key={viewer}
                className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-bark/5 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                  {viewer.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{viewer}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
