import { and, asc, desc, eq, lte } from "drizzle-orm";
import { getDb, postMedia, posts } from "@/db";

/** Same UTC format IG uses ("2025-11-22T05:38:21+0000"), so strings sort by time. */
export function toPostedAt(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "+0000");
}

export function parsePostedAt(value: string) {
  return new Date(value.replace(/\+0000$/, "Z"));
}

/** Everything visitors can see: IG posts plus local posts whose time has come. */
export function listPosts() {
  return getDb()
    .select()
    .from(posts)
    .where(lte(posts.postedAt, toPostedAt(new Date())))
    .orderBy(desc(posts.postedAt))
    .all();
}

/** Posts uploaded through /admin, scheduled ones included. */
export function listLocalPosts() {
  return getDb()
    .select()
    .from(posts)
    .where(eq(posts.source, "local"))
    .orderBy(desc(posts.postedAt))
    .all();
}

export function isScheduled(post: { postedAt: string }) {
  return post.postedAt > toPostedAt(new Date());
}

export function getPost(id: string) {
  const post = getDb().select().from(posts).where(eq(posts.id, id)).get();
  if (!post) return undefined;
  const media = getDb()
    .select()
    .from(postMedia)
    .where(eq(postMedia.postId, id))
    .orderBy(asc(postMedia.position))
    .all();
  return { ...post, media };
}

export function getMedia(id: string) {
  return getDb().select().from(postMedia).where(eq(postMedia.id, id)).get();
}

export function getLocalPost(id: string) {
  return getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.source, "local")))
    .get();
}
