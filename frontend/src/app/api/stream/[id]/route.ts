import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { config } from "@/lib/config";
import { getMedia } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await getMedia(id);

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const streamUrl =
    media.media_type === "video"
      ? `${config.watchServiceUrl}/api/videos/${id}/stream`
      : `${config.uploadServiceUrl}/api/uploads/${id}/stream`;

  const headers: HeadersInit =
    media.media_type === "video"
      ? { Authorization: `Bearer ${token}` }
      : {};

  const upstream = await fetch(streamUrl, { headers });

  if (!upstream.ok) {
    const error = await upstream.text();
    return NextResponse.json(
      { error: error || "Stream failed" },
      { status: upstream.status }
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("Content-Type", contentType);

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);

  const disposition = upstream.headers.get("content-disposition");
  if (disposition) responseHeaders.set("Content-Disposition", disposition);

  return new NextResponse(upstream.body, {
    status: 200,
    headers: responseHeaders,
  });
}
