import Link from "next/link";
import { listPosts } from "@/lib/posts";
import { Images, Play } from "lucide-react";
import TilePending from "@/components/TilePending";

export const dynamic = "force-dynamic";

export default function Home() {
  const posts = listPosts();

  if (!posts.length) {
    return (
      <p className="p-8 text-center text-neutral-500">
        Belum ada post. Jalankan <code>npm run sync</code> dulu.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/p/${post.id}`}
          className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900"
        >
          {post.thumbKey && (
            <img
              src={`/media/${post.thumbKey}`}
              alt={post.caption?.slice(0, 100) ?? ""}
              loading="lazy"
              className="size-full object-cover transition hover:opacity-90"
            />
          )}
          {post.mediaType !== "IMAGE" && (
            <span className="absolute right-1.5 top-1.5 text-white drop-shadow">
              {post.mediaType === "VIDEO" ? (
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
  );
}
