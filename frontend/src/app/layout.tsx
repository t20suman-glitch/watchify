import type { Metadata } from "next";
import { AuthNav } from "@/components/AuthNav";
import { Logo } from "@/components/Logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watchify",
  description: "Watch and listen to uploaded videos and audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Logo />
            <AuthNav />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
