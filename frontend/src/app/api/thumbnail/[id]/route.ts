import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getMedia } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const media = await getMedia(id);

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (media.media_type !== "video") {
    return NextResponse.json({ error: "Not a video" }, { status: 400 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(
    `${config.uploadServiceUrl}/api/uploads/${id}/stream`,
    {
      headers: range ? { Range: range } : {},
    }
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Thumbnail stream failed" },
      { status: upstream.status }
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
