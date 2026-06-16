import { isAuthenticated } from "@/lib/auth";
import { listMedia } from "@/lib/api";
import { HeroBanner } from "@/components/HeroBanner";
import { MediaRow } from "@/components/MediaRow";

export default async function HomePage() {
  const [media, loggedIn] = await Promise.all([
    listMedia(),
    isAuthenticated(),
  ]);

  const videos = media.filter((item) => item.media_type === "video");
  const audio = media.filter((item) => item.media_type === "music");
  const featured = videos[0] ?? media[0];

  return (
    <div>
      {featured ? (
        <HeroBanner media={featured} loggedIn={loggedIn} />
      ) : (
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Browse</h1>
          <p className="mt-2 text-sm text-muted">
            {loggedIn
              ? "Pick something to watch or listen."
              : "Sign in to start watching."}
          </p>
        </div>
      )}

      {media.length === 0 ? (
        <p className="text-sm text-muted">No uploads yet.</p>
      ) : (
        <>
          <MediaRow title="Videos" media={videos} loggedIn={loggedIn} />
          <MediaRow title="Music & Audio" media={audio} loggedIn={loggedIn} />
        </>
      )}
    </div>
  );
}
