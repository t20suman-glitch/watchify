import Link from "next/link";
import type { Media } from "@/lib/types";
import { VideoThumbnail } from "@/components/VideoThumbnail";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function HeroBanner({
  media,
  loggedIn,
}: {
  media: Media;
  loggedIn: boolean;
}) {
  const href = loggedIn ? `/watch/${media.id}` : "/login";
  const isVideo = media.media_type === "video";

  return (
    <section className="relative mb-12 overflow-hidden rounded-xl md:rounded-2xl">
      <div className="relative aspect-[21/9] min-h-[220px] w-full bg-surface-elevated md:min-h-[320px]">
        {isVideo ? (
          <VideoThumbnail mediaId={media.id} title={media.title} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/30 via-surface-elevated to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Featured
        </p>
        <h1 className="mb-2 max-w-xl text-2xl font-bold tracking-tight text-white md:text-4xl">
          {media.title}
        </h1>
        {media.description ? (
          <p className="mb-4 max-w-lg line-clamp-2 text-sm text-zinc-300 md:text-base">
            {media.description}
          </p>
        ) : null}
        <p className="mb-5 text-xs text-zinc-400">
          {media.original_filename} · {formatSize(media.size_bytes)}
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          <PlayIcon className="h-4 w-4" />
          {loggedIn ? (isVideo ? "Play" : "Listen") : "Sign in to watch"}
        </Link>
      </div>
    </section>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
