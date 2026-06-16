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
        <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-8">
            <Logo />
            <AuthNav />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </body>
    </html>
  );
}
