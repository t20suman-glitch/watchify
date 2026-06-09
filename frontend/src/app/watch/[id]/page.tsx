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
        className="mb-6 inline-block text-sm text-neutral-500 hover:underline"
      >
        ← Back
      </Link>

      <h1 className="mb-4 text-xl font-medium">{media.title}</h1>

      {isVideo ? (
        <video
          src={streamSrc}
          controls
          className="w-full rounded bg-black"
          playsInline
        />
      ) : (
        <audio src={streamSrc} controls className="w-full" />
      )}

      {media.description ? (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          {media.description}
        </p>
      ) : null}
    </div>
  );
}
