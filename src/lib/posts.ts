import { asc, desc, eq } from "drizzle-orm";
import { getDb, postMedia, posts } from "@/db";

export function listPosts() {
  return getDb().select().from(posts).orderBy(desc(posts.postedAt)).all();
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
