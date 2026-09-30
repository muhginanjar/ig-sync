import { eq, notInArray } from "drizzle-orm";
import { db, postMedia, posts } from "@/db";
import { listAllMedia, type IgChild, type IgMedia } from "./instagram";
import { putObject } from "./storage";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

async function download(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal download ${res.status}: ${url}`);
  const contentType = (res.headers.get("content-type") ?? "application/octet-stream").split(";")[0];
  return { body: Buffer.from(await res.arrayBuffer()), contentType };
}

async function upload(url: string, keyBase: string) {
  const { body, contentType } = await download(url);
  const key = `${keyBase}.${EXT[contentType] ?? "bin"}`;
  await putObject(key, body, contentType);
  return { key, contentType, sizeBytes: body.length };
}

/** A single IMAGE/VIDEO post is treated as a one-item carousel. */
function itemsOf(post: IgMedia): IgChild[] {
  if (post.media_type === "CAROUSEL_ALBUM") return post.children?.data ?? [];
  return [
    {
      id: post.id,
      media_type: post.media_type,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url,
    },
  ];
}

async function importPost(post: IgMedia, log: (m: string) => void) {
  const dir = `posts/${post.id}`;
  const rows: (typeof postMedia.$inferInsert)[] = [];

  for (const [position, item] of itemsOf(post).entries()) {
    if (!item.media_url) {
      log(`  ! ${post.id} item ${position}: media_url kosong (kemungkinan diblokir IG), dilewati`);
      continue;
    }
    const stored = await upload(item.media_url, `${dir}/${position}-${item.id}`);
    rows.push({ id: item.id, postId: post.id, position, mediaType: item.media_type, ...stored });
  }

  // Grid thumbnail: first image as-is, or the video's cover frame.
  const first = itemsOf(post)[0];
  let thumbKey = rows.find((r) => r.position === 0 && r.mediaType === "IMAGE")?.key ?? null;
  const coverUrl = first?.thumbnail_url ?? post.thumbnail_url;
  if (!thumbKey && coverUrl) thumbKey = (await upload(coverUrl, `${dir}/thumb`)).key;

  db.transaction((tx) => {
    tx.insert(posts)
      .values({
        id: post.id,
        mediaType: post.media_type,
        caption: post.caption ?? null,
        permalink: post.permalink,
        postedAt: post.timestamp,
        thumbKey,
        syncedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: posts.id,
        set: { caption: post.caption ?? null, thumbKey, syncedAt: new Date().toISOString() },
      })
      .run();
    tx.delete(postMedia).where(eq(postMedia.postId, post.id)).run();
    if (rows.length) tx.insert(postMedia).values(rows).run();
  });
}

export async function syncInstagram({
  full = false,
  log = console.log,
}: { full?: boolean; log?: (m: string) => void } = {}) {
  const known = new Set(db.select({ id: posts.id }).from(posts).all().map((p) => p.id));
  const seen: string[] = [];
  let imported = 0;

  for await (const post of listAllMedia()) {
    seen.push(post.id);
    if (known.has(post.id) && !full) {
      // Media already stored; just keep the caption in sync (it can be edited on IG).
      db.update(posts).set({ caption: post.caption ?? null }).where(eq(posts.id, post.id)).run();
      continue;
    }
    log(`→ ${post.media_type.padEnd(14)} ${post.id} ${post.timestamp}`);
    await importPost(post, log);
    imported++;
  }

  // Posts deleted on IG disappear from the app. Stored files are kept
  // (Wasabi bills a 90-day minimum anyway).
  const removed = seen.length
    ? db.delete(posts).where(notInArray(posts.id, seen)).run().changes
    : 0;

  log(`Selesai: ${seen.length} post di IG, ${imported} diimpor, ${removed} dihapus.`);
  return { total: seen.length, imported, removed };
}
