import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function AuthNav() {
  const loggedIn = await isAuthenticated();

  return (
    <nav className="flex items-center gap-4 text-sm">
      {loggedIn ? (
        <>
          <span className="text-muted">Signed in</span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login" className="text-muted transition hover:text-foreground">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-foreground transition hover:border-accent/40 hover:text-accent"
          >
            Register
          </Link>
        </>
      )}
    </nav>
  );
}
