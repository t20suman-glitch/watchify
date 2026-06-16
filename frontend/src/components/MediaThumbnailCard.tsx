import Link from "next/link";
import type { Media } from "@/lib/types";
import { VideoThumbnail } from "@/components/VideoThumbnail";

export function MediaThumbnailCard({
  media,
  loggedIn,
}: {
  media: Media;
  loggedIn: boolean;
}) {
  const isVideo = media.media_type === "video";
  const href = loggedIn ? `/watch/${media.id}` : "/login";

  return (
    <Link
      href={href}
      className="media-card group block shrink-0"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-surface-elevated shadow-lg ring-1 ring-white/5">
        {isVideo ? (
          <VideoThumbnail mediaId={media.id} title={media.title} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent/20 via-surface-elevated to-zinc-950">
            <MusicIcon className="h-10 w-10 text-accent/70" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Audio
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition group-hover:opacity-100" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-background shadow-xl">
            <PlayIcon className="ml-0.5 h-5 w-5" />
          </span>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-md">
            {media.title}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
