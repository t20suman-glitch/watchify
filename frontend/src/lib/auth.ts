import { cookies } from "next/headers";

export const AUTH_COOKIE = "auth_token";

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  return !!(await getToken());
}
