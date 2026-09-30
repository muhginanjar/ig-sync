import type { Post } from "@/db";
import { listPosts } from "./posts";

export const PAGE_SIZE = 24;

export type TabId = "semua" | "foto" | "video";

// Carousels go under "Foto" even when some slides are videos.
export const TABS: { id: TabId; label: string; match: (p: Post) => boolean }[] = [
  { id: "semua", label: "Semua", match: () => true },
  { id: "foto", label: "Foto", match: (p) => p.mediaType !== "VIDEO" },
  { id: "video", label: "Video", match: (p) => p.mediaType === "VIDEO" },
];

export function tabOf(id: unknown) {
  return TABS.find((t) => t.id === id) ?? TABS[0];
}

export type Tile = {
  id: string;
  mediaType: Post["mediaType"];
  local: boolean; // uploaded through /admin, not on Instagram
  thumbUrl: string | null;
  alt: string;
};

function toTile(p: Post): Tile {
  const key = p.gridKey ?? p.thumbKey; // old posts fall back to the full-size cover
  return {
    id: p.id,
    mediaType: p.mediaType,
    local: p.source === "local",
    thumbUrl: key ? `/media/${key}` : null,
    alt: p.caption?.slice(0, 100) ?? "",
  };
}

/** One page of a tab's posts (176 rows filter fine in memory). */
export function pageOfTab(tab: TabId, offset: number) {
  const matching = listPosts().filter(tabOf(tab).match);
  return {
    tiles: matching.slice(offset, offset + PAGE_SIZE).map(toTile),
    hasMore: offset + PAGE_SIZE < matching.length,
  };
}
