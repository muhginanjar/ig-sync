import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { NavigationTracker } from "@/components/BackButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "Infimate Travel", template: "%s · Infimate Travel" },
  description: "Semua postingan @infimate.travel, siap dibagikan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <NavigationTracker />
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="font-semibold">
              @infimate.travel
            </Link>
            <a
              href="https://www.instagram.com/infimate.travel/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Buka di Instagram
              <ExternalLink className="size-4" />
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-4xl">{children}</main>
      </body>
    </html>
  );
}
