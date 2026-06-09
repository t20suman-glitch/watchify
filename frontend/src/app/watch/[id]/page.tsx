import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getMedia } from "@/lib/api";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const loggedIn = await isAuthenticated();
  if (!loggedIn) {
    redirect("/login");
  }

  const { id } = await params;
  const media = await getMedia(id);

  if (!media) {
    notFound();
  }

  const isVideo = media.media_type === "video";
  const streamSrc = `/api/stream/${id}`;

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted transition hover:text-accent"
      >
        ← Back
      </Link>

      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{media.title}</h1>

      <div className="overflow-hidden rounded-xl border border-border bg-black shadow-2xl shadow-black/40">
        {isVideo ? (
          <video
            src={streamSrc}
            controls
            className="w-full"
            playsInline
          />
        ) : (
          <div className="bg-surface-elevated p-6">
            <audio src={streamSrc} controls className="w-full" />
          </div>
        )}
      </div>

      {media.description ? (
        <p className="mt-4 text-sm text-muted">{media.description}</p>
      ) : null}
    </div>
  );
}
