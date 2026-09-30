"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Images, LoaderCircle, Play, Sparkles } from "lucide-react";
import type { TabId, Tile } from "@/lib/tabs";
import TilePending from "./TilePending";

export default function PostGrid({
  tab,
  initial,
  initialHasMore,
}: {
  tab: TabId;
  initial: Tile[];
  initialHasMore: boolean;
}) {
  const [tiles, setTiles] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  async function loadMore() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/posts?tab=${tab}&offset=${tiles.length}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const page: { tiles: Tile[]; hasMore: boolean } = await res.json();
      setTiles((prev) => [...prev, ...page.tiles]);
      setHasMore(page.hasMore);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  // Fetch the next page well before the visitor reaches the bottom.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), {
      rootMargin: "800px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
    // loadMore reads the latest tiles each render; re-observe after every page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, failed, tiles.length]);

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
        {tiles.map((tile, i) => (
          <Link
            key={tile.id}
            href={`/p/${tile.id}`}
            className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900"
          >
            {tile.thumbUrl && (
              <img
                src={tile.thumbUrl}
                alt={tile.alt}
                // First rows are on screen immediately; the rest load as they scroll in.
                loading={i < 6 ? "eager" : "lazy"}
                fetchPriority={i < 3 ? "high" : "auto"}
                decoding="async"
                width={480}
                height={480}
                className="size-full object-cover transition hover:opacity-90"
              />
            )}
            {tile.local && (
              <span
                title="Hanya di aplikasi"
                className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 p-1 text-amber-950 shadow"
              >
                <Sparkles className="size-3.5" />
              </span>
            )}
            {tile.mediaType !== "IMAGE" && (
              <span className="absolute right-1.5 top-1.5 text-white drop-shadow">
                {tile.mediaType === "VIDEO" ? (
                  <Play className="size-5" fill="currentColor" />
                ) : (
                  <Images className="size-5" />
                )}
              </span>
            )}
            <TilePending />
          </Link>
        ))}
      </div>

      <div ref={sentinel} className="flex h-16 items-center justify-center text-sm text-neutral-500">
        {loading && <LoaderCircle className="size-6 animate-spin" />}
        {failed && (
          <button onClick={loadMore} className="underline">
            Gagal memuat, coba lagi
          </button>
        )}
      </div>
    </>
  );
}
