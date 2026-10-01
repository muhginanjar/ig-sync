import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getPost, isScheduled, parsePostedAt } from "@/lib/posts";
import { filePrefix } from "@/lib/site";
import BackButton from "@/components/BackButton";
import MediaViewer from "@/components/MediaViewer";
import ShareActions from "@/components/ShareActions";

export const dynamic = "force-dynamic";

function titleOf(caption: string | null) {
  const firstLine = caption?.split("\n")[0].trim() ?? "";
  return firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine || "Post";
}

/** Scheduled posts stay hidden from visitors until their time; admins can preview. */
async function getVisiblePost(id: string) {
  const post = getPost(id);
  if (!post || (isScheduled(post) && !(await isAdmin()))) return undefined;
  return post;
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const post = await getVisiblePost((await params).id);
  if (!post) return {};
  return {
    title: titleOf(post.caption),
    description: post.caption?.slice(0, 200),
    openGraph: {
      title: titleOf(post.caption),
      description: post.caption?.slice(0, 200),
      images: post.thumbKey ? [`/media/${post.thumbKey}`] : [],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/p/[id]">) {
  const post = await getVisiblePost((await params).id);
  if (!post) notFound();

  const prefix = filePrefix();
  const files = post.media.map((m) => ({
    id: m.id,
    type: m.mediaType,
    contentType: m.contentType,
    sizeBytes: m.sizeBytes,
    displayUrl: `/media/${m.key}`,
    fileUrl: `/api/file/${m.id}`,
    filename: `${prefix}-${post.id}-${m.position + 1}.${m.key.split(".").pop()}`,
  }));

  return (
    <article className="mx-auto max-w-xl pb-16">
      <BackButton />
      {isScheduled(post) && (
        <p className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          <CalendarClock className="size-4 shrink-0" />
          Terjadwal. Hanya admin yang bisa melihat post ini sampai waktunya tiba.
        </p>
      )}
      <MediaViewer items={files} />
      <div className="space-y-4 px-4 pt-4">
        <ShareActions files={files} caption={post.caption ?? ""} permalink={post.permalink} />
        <time className="block text-xs uppercase tracking-wide text-neutral-500">
          {parsePostedAt(post.postedAt).toLocaleDateString("id-ID", {
            dateStyle: "long",
            timeZone: "Asia/Jakarta",
          })}
        </time>
        {post.caption && <p className="whitespace-pre-line text-sm leading-relaxed">{post.caption}</p>}
      </div>
    </article>
  );
}
