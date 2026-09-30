import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, postMedia, posts } from "@/db";
import { getObject, objectSize, signedUploadUrl } from "./storage";
import { uploadGridThumb } from "./thumbs";
import { toPostedAt } from "./posts";

export const MAX_FILES = 20; // same limit as an IG carousel
const CLOCK_SKEW_MS = 10 * 60 * 1000; // "now" on the phone vs. the server

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export type Kind = "IMAGE" | "VIDEO";

export class InputError extends Error {}

const isLocalId = (id: string) => /^local-[0-9a-f-]{36}$/.test(id);

/** Step 1: reserve a post id and hand out presigned upload URLs. */
export async function prepareUploads(files: { contentType: string }[]) {
  if (!files.length || files.length > MAX_FILES) {
    throw new InputError(`Pilih 1–${MAX_FILES} file`);
  }
  const postId = `local-${randomUUID()}`;
  const dir = `posts/${postId}`;

  return {
    postId,
    files: await Promise.all(
      files.map(async ({ contentType }, i) => {
        const ext = EXT[contentType];
        if (!ext) throw new InputError(`Jenis file tidak didukung: ${contentType || "tidak diketahui"}`);
        const kind: Kind = contentType.startsWith("video/") ? "VIDEO" : "IMAGE";
        const key = `${dir}/${i}-${randomUUID()}.${ext}`;
        // Videos also get a cover frame, captured in the browser.
        const coverKey = kind === "VIDEO" ? `${dir}/${i}-cover.jpg` : undefined;
        return {
          kind,
          key,
          uploadUrl: await signedUploadUrl(key, contentType),
          coverKey,
          coverUploadUrl: coverKey ? await signedUploadUrl(coverKey, "image/jpeg") : undefined,
        };
      }),
    ),
  };
}

export function validatePostedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new InputError("Tanggal tidak valid");
  if (date.getTime() < Date.now() - CLOCK_SKEW_MS) {
    throw new InputError("Tanggal posting harus sekarang atau di masa depan");
  }
  return toPostedAt(date);
}

/** Step 2: after the browser uploaded everything, record the post. */
export async function createLocalPost(input: {
  postId: string;
  caption: string;
  postedAt: string;
  items: { key: string; kind: Kind; contentType: string; coverKey?: string }[];
}) {
  const { postId, items } = input;
  const dir = `posts/${postId}`;
  if (!isLocalId(postId)) throw new InputError("postId tidak valid");
  if (!items.length || items.length > MAX_FILES) throw new InputError(`Pilih 1–${MAX_FILES} file`);
  const postedAt = validatePostedAt(input.postedAt);

  const rows = await Promise.all(
    items.map(async (item, position) => {
      const keys = [item.key, item.coverKey].filter(Boolean) as string[];
      if (keys.some((k) => !k.startsWith(`${dir}/`))) throw new InputError("Key file tidak valid");
      const size = await objectSize(item.key);
      if (size === undefined) throw new InputError(`File ${position + 1} belum ter-upload`);
      return {
        id: randomUUID(),
        postId,
        position,
        mediaType: item.kind,
        key: item.key,
        contentType: item.contentType,
        sizeBytes: size,
      };
    }),
  );

  // Cover = first slide (its captured frame when it's a video).
  const first = items[0];
  const thumbKey = first.kind === "VIDEO" ? first.coverKey : first.key;
  if (!thumbKey || (await objectSize(thumbKey)) === undefined) {
    throw new InputError("Cover video belum ter-upload");
  }
  const cover = await getObject(thumbKey);
  const gridKey = await uploadGridThumb(Buffer.from(await cover.Body!.transformToByteArray()), dir);

  getDb().transaction((tx) => {
    tx.insert(posts)
      .values({
        id: postId,
        source: "local",
        mediaType: items.length > 1 ? "CAROUSEL_ALBUM" : first.kind,
        caption: input.caption.trim() || null,
        permalink: null,
        postedAt,
        thumbKey,
        gridKey,
        syncedAt: new Date().toISOString(),
      })
      .run();
    tx.insert(postMedia).values(rows).run();
  });
  return postId;
}

export function updateLocalPost(
  id: string,
  current: { postedAt: string },
  input: { caption?: string; postedAt?: string },
) {
  const set: { caption?: string | null; postedAt?: string } = {};
  if (input.caption !== undefined) set.caption = input.caption.trim() || null;
  if (input.postedAt !== undefined) {
    const date = new Date(input.postedAt);
    if (Number.isNaN(date.getTime())) throw new InputError("Tanggal tidak valid");
    const next = toPostedAt(date);
    // Keeping an already-published date is fine; a new date can't be in the past.
    if (next !== current.postedAt) set.postedAt = validatePostedAt(input.postedAt);
  }
  if (Object.keys(set).length) getDb().update(posts).set(set).where(eq(posts.id, id)).run();
}

export function deleteLocalPost(id: string) {
  // post_media rows go with it (ON DELETE CASCADE). Files stay in Wasabi.
  getDb().delete(posts).where(eq(posts.id, id)).run();
}
