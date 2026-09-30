PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'instagram' NOT NULL,
	`media_type` text NOT NULL,
	`caption` text,
	`permalink` text,
	`posted_at` text NOT NULL,
	`thumb_key` text,
	`grid_key` text,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "source", "media_type", "caption", "permalink", "posted_at", "thumb_key", "grid_key", "synced_at") SELECT "id", 'instagram', "media_type", "caption", "permalink", "posted_at", "thumb_key", "grid_key", "synced_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;