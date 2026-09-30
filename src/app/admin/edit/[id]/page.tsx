import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLocalPost, parsePostedAt } from "@/lib/posts";
import EditForm from "@/components/admin/EditForm";

export default async function EditPostPage({ params }: PageProps<"/admin/edit/[id]">) {
  await requireAdmin();
  const post = getLocalPost((await params).id);
  if (!post) notFound();
  return (
    <EditForm
      id={post.id}
      caption={post.caption ?? ""}
      postedAt={parsePostedAt(post.postedAt).toISOString()}
    />
  );
}
