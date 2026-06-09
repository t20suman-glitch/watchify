import { isAuthenticated } from "@/lib/auth";
import { listMedia } from "@/lib/api";
import { MediaCard } from "@/components/MediaCard";

export default async function HomePage() {
  const [media, loggedIn] = await Promise.all([
    listMedia(),
    isAuthenticated(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Browse</h1>
      <p className="mb-8 text-sm text-muted">
        {loggedIn
          ? "Select a video or audio to play."
          : "Sign in to watch or listen."}
      </p>

      {media.length === 0 ? (
        <p className="text-sm text-muted">No uploads yet.</p>
      ) : (
        <ul className="space-y-4">
          {media.map((item) => (
            <li key={item.id}>
              <MediaCard media={item} loggedIn={loggedIn} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
