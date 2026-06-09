import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function AuthNav() {
  const loggedIn = await isAuthenticated();

  return (
    <nav className="flex items-center gap-4 text-sm">
      {loggedIn ? (
        <>
          <span className="text-neutral-500">Signed in</span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login" className="hover:underline">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded border border-neutral-300 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Register
          </Link>
        </>
      )}
    </nav>
  );
}
