import Link from "next/link";
import { Images, LayoutGrid, Play, type LucideIcon } from "lucide-react";
import { listPosts } from "@/lib/posts";
import { pageOfTab, tabOf, TABS, type TabId } from "@/lib/tabs";
import PostGrid from "@/components/PostGrid";
import TabPending from "@/components/TabPending";

export const dynamic = "force-dynamic";

const ICONS: Record<TabId, LucideIcon> = { semua: LayoutGrid, foto: Images, video: Play };

export default async function Home({ searchParams }: PageProps<"/">) {
  const active = tabOf((await searchParams).tab);
  const all = listPosts();

  if (!all.length) {
    return (
      <p className="p-8 text-center text-neutral-500">
        Belum ada post. Jalankan <code>npm run sync</code> dulu.
      </p>
    );
  }

  const first = pageOfTab(active.id, 0);

  return (
    <>
      <nav className="sticky top-14 z-10 grid grid-cols-3 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        {TABS.map((t) => {
          const selected = t.id === active.id;
          const Icon = ICONS[t.id];
          return (
            <Link
              key={t.id}
              href={t.id === "semua" ? "/" : `/?tab=${t.id}`}
              aria-current={selected ? "page" : undefined}
              className={`flex items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium ${
                selected
                  ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
              <span className="text-xs text-neutral-400">{all.filter(t.match).length}</span>
              <TabPending />
            </Link>
          );
        })}
      </nav>

      {!first.tiles.length && (
        <p className="p-8 text-center text-neutral-500">Belum ada post di tab ini.</p>
      )}

      {/* key: a new tab starts a fresh list instead of appending to the old one */}
      <PostGrid
        key={active.id}
        tab={active.id}
        initial={first.tiles}
        initialHasMore={first.hasMore}
      />
    </>
  );
}
