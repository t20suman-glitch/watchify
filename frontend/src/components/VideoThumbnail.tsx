"use client";

import { useState } from "react";

export function VideoThumbnail({ mediaId, title }: { mediaId: string; title: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
        <PlayIcon className="h-12 w-12 text-white/40" />
      </div>
    );
  }

  return (
    <video
      src={`/api/thumbnail/${mediaId}`}
      preload="metadata"
      muted
      playsInline
      aria-label={title}
      className="h-full w-full object-cover"
      onLoadedData={(event) => {
        const video = event.currentTarget;
        if (video.duration > 0.5) {
          video.currentTime = Math.min(1, video.duration * 0.1);
        }
      }}
      onError={() => setFailed(true)}
    />
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
