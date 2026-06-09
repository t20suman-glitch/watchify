import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { config } from "@/lib/config";

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const res = await fetch(`${config.userServiceUrl}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ user: null });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
