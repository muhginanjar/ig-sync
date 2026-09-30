import { asc, desc, eq } from "drizzle-orm";
import { db, postMedia, posts } from "@/db";

export function listPosts() {
  return db.select().from(posts).orderBy(desc(posts.postedAt)).all();
}

export function getPost(id: string) {
  const post = db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) return undefined;
  const media = db
    .select()
    .from(postMedia)
    .where(eq(postMedia.postId, id))
    .orderBy(asc(postMedia.position))
    .all();
  return { ...post, media };
}

export function getMedia(id: string) {
  return db.select().from(postMedia).where(eq(postMedia.id, id)).get();
}
