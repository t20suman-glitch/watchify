import Link from "next/link";
import type { Media } from "@/lib/types";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MediaCard({
  media,
  loggedIn,
}: {
  media: Media;
  loggedIn: boolean;
}) {
  const isVideo = media.media_type === "video";
  const label = isVideo ? "Video" : "Audio";

  return (
    <article className="card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-accent">
          {label}
        </span>
        <span className="text-xs text-subtle">{formatDate(media.created_at)}</span>
      </div>

      <h2 className="mb-1 text-base font-medium text-foreground">{media.title}</h2>

      {media.description ? (
        <p className="mb-3 text-sm text-muted">{media.description}</p>
      ) : null}

      <p className="mb-4 text-xs text-subtle">
        {media.original_filename} · {formatSize(media.size_bytes)}
      </p>

      {loggedIn ? (
        <Link href={`/watch/${media.id}`} className="link-accent text-sm font-medium">
          {isVideo ? "Watch" : "Listen"} →
        </Link>
      ) : (
        <Link href="/login" className="text-sm text-muted transition hover:text-foreground">
          Sign in to {isVideo ? "watch" : "listen"}
        </Link>
      )}
    </article>
  );
}
