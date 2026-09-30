import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";
import BackButton from "@/components/BackButton";
import MediaViewer from "@/components/MediaViewer";
import ShareActions from "@/components/ShareActions";

export const dynamic = "force-dynamic";

function titleOf(caption: string | null) {
  const firstLine = caption?.split("\n")[0].trim() ?? "";
  return firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine || "Post";
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const post = getPost((await params).id);
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
  const post = getPost((await params).id);
  if (!post) notFound();

  const files = post.media.map((m) => ({
    id: m.id,
    type: m.mediaType,
    contentType: m.contentType,
    sizeBytes: m.sizeBytes,
    displayUrl: `/media/${m.key}`,
    fileUrl: `/api/file/${m.id}`,
    filename: `infimate-${post.id}-${m.position + 1}.${m.key.split(".").pop()}`,
  }));

  return (
    <article className="mx-auto max-w-xl pb-16">
      <BackButton />
      <MediaViewer items={files} />
      <div className="space-y-4 px-4 pt-4">
        <ShareActions files={files} caption={post.caption ?? ""} permalink={post.permalink} />
        <time className="block text-xs uppercase tracking-wide text-neutral-500">
          {new Date(post.postedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
        </time>
        {post.caption && <p className="whitespace-pre-line text-sm leading-relaxed">{post.caption}</p>}
      </div>
    </article>
  );
}
