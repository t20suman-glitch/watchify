import type { Media } from "@/lib/types";
import { MediaThumbnailCard } from "@/components/MediaThumbnailCard";

export function MediaRow({
  title,
  media,
  loggedIn,
}: {
  title: string;
  media: Media[];
  loggedIn: boolean;
}) {
  if (media.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground md:text-xl">
        {title}
      </h2>
      <div className="media-row -mx-4 px-4 md:-mx-8 md:px-8">
        {media.map((item) => (
          <MediaThumbnailCard key={item.id} media={item} loggedIn={loggedIn} />
        ))}
      </div>
    </section>
  );
}
