import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  const { email, username, password } = (await request.json()) as {
    email?: string;
    username?: string;
    password?: string;
  };

  if (!email || !username || !password) {
    return NextResponse.json(
      { error: "Email, username, and password are required" },
      { status: 400 }
    );
  }

  const res = await fetch(`${config.userServiceUrl}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
