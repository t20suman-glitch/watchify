import { config } from "./config";
import type { Media } from "./types";

export async function listMedia(): Promise<Media[]> {
  const res = await fetch(
    `${config.uploadServiceUrl}/api/uploads?limit=50`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to load media");
  }

  const data = (await res.json()) as { media: Media[] };
  return data.media;
}

export async function getMedia(id: string): Promise<Media | null> {
  const res = await fetch(`${config.uploadServiceUrl}/api/uploads/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load media");

  const data = (await res.json()) as { media: Media };
  return data.media;
}
