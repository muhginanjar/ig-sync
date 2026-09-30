import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(), // Instagram media id
  mediaType: text("media_type").$type<MediaType>().notNull(),
  caption: text("caption"),
  permalink: text("permalink").notNull(),
  postedAt: text("posted_at").notNull(), // ISO timestamp from IG
  thumbKey: text("thumb_key"), // full-size cover, used for link previews (OG image)
  gridKey: text("grid_key"), // small square WebP for the grid
  syncedAt: text("synced_at").notNull(),
});

export const postMedia = sqliteTable(
  "post_media",
  {
    id: text("id").primaryKey(), // IG child id, or the post id for single media
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    mediaType: text("media_type").$type<"IMAGE" | "VIDEO">().notNull(),
    key: text("key").notNull(), // storage key in Wasabi
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
  },
  (t) => [index("post_media_post_idx").on(t.postId, t.position)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Post = typeof posts.$inferSelect;
export type PostMedia = typeof postMedia.$inferSelect;
