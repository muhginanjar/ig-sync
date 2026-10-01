import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { NavigationTracker } from "@/components/BackButton";
import ReminderButton from "@/components/ReminderButton";
import { accountUsername, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

// Name and links come from the database (the synced IG account), so render
// per request; this also keeps `next build` from touching the database.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const name = siteName();
  const username = accountUsername();
  return {
    metadataBase: siteUrl() ?? new URL("http://localhost:3000"),
    title: { default: name, template: `%s · ${name}` },
    description: username
      ? `Semua postingan @${username}, siap dibagikan.`
      : "Postingan Instagram, siap dibagikan.",
  };
}

const headerAction =
  "flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const username = accountUsername();
  return (
    <html lang="id">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <NavigationTracker />
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="truncate font-semibold">
              {siteName()}
            </Link>
            <div className="flex items-center gap-4">
              <ReminderButton className={headerAction} />
              {username && (
                <a
                  href={`https://www.instagram.com/${username}/`}
                  target="_blank"
                  rel="noreferrer"
                  className={headerAction}
                >
                  <span className="sm:hidden">Instagram</span>
                  <span className="hidden sm:inline">Buka di Instagram</span>
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl">{children}</main>
      </body>
    </html>
  );
}
