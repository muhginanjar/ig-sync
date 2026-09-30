import { eq, notInArray } from "drizzle-orm";
import { getDb, postMedia, posts } from "@/db";
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

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000];

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

async function downloadOnce(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5 * 60_000) });
  if (!res.ok) throw new HttpError(res.status);
  const contentType = (res.headers.get("content-type") ?? "application/octet-stream").split(";")[0];
  return { body: Buffer.from(await res.arrayBuffer()), contentType };
}

/** IG's CDN occasionally drops connections on large videos, so retry network errors and 429/5xx. */
async function download(url: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await downloadOnce(url);
    } catch (err) {
      const retryable = !(err instanceof HttpError) || err.status === 429 || err.status >= 500;
      if (!retryable || attempt >= RETRY_DELAYS_MS.length) {
        throw new Error(`Gagal download setelah ${attempt + 1}x percobaan: ${(err as Error).message}`, {
          cause: err,
        });
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
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

  getDb().transaction((tx) => {
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
  const known = new Set(getDb().select({ id: posts.id }).from(posts).all().map((p) => p.id));
  const seen: string[] = [];
  const failed: string[] = [];
  let imported = 0;

  for await (const post of listAllMedia()) {
    seen.push(post.id);
    if (known.has(post.id) && !full) {
      // Media already stored; just keep the caption in sync (it can be edited on IG).
      getDb().update(posts).set({ caption: post.caption ?? null }).where(eq(posts.id, post.id)).run();
      continue;
    }
    log(`→ ${post.media_type.padEnd(14)} ${post.id} ${post.timestamp}`);
    try {
      await importPost(post, log);
      imported++;
    } catch (err) {
      // Nothing is written to the DB for a failed post, so the next sync retries it.
      failed.push(post.id);
      log(`  ✗ ${post.id} dilewati: ${(err as Error).message}`);
    }
  }

  // Posts deleted on IG disappear from the app. Stored files are kept
  // (Wasabi bills a 90-day minimum anyway).
  const removed = seen.length
    ? getDb().delete(posts).where(notInArray(posts.id, seen)).run().changes
    : 0;

  log(
    `Selesai: ${seen.length} post di IG, ${imported} diimpor, ${failed.length} gagal, ${removed} dihapus.`,
  );
  if (failed.length) log(`Post gagal akan dicoba lagi di sync berikutnya: ${failed.join(", ")}`);
  return { total: seen.length, imported, failed, removed };
}
