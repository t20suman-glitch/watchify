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
    <article className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        <span className="text-xs text-neutral-400">
          {formatDate(media.created_at)}
        </span>
      </div>

      <h2 className="mb-1 font-medium">{media.title}</h2>

      {media.description ? (
        <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
          {media.description}
        </p>
      ) : null}

      <p className="mb-4 text-xs text-neutral-400">
        {media.original_filename} · {formatSize(media.size_bytes)}
      </p>

      {loggedIn ? (
        <Link
          href={`/watch/${media.id}`}
          className="text-sm font-medium hover:underline"
        >
          {isVideo ? "Watch" : "Listen"} →
        </Link>
      ) : (
        <Link href="/login" className="text-sm text-neutral-500 hover:underline">
          Sign in to {isVideo ? "watch" : "listen"}
        </Link>
      )}
    </article>
  );
}
