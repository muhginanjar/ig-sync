import { adminGuard } from "@/lib/auth";
import { handle } from "@/lib/api";
import { deleteLocalPost, updateLocalPost } from "@/lib/local-posts";
import { getLocalPost } from "@/lib/posts";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/posts/[id]">) {
  const denied = await adminGuard();
  if (denied) return denied;
  const post = getLocalPost((await ctx.params).id);
  if (!post) return Response.json({ error: "Post tidak ditemukan" }, { status: 404 });
  return handle(async () => {
    updateLocalPost(post.id, post, await req.json());
    return Response.json({ ok: true });
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/posts/[id]">) {
  const denied = await adminGuard();
  if (denied) return denied;
  const post = getLocalPost((await ctx.params).id);
  if (!post) return Response.json({ error: "Post tidak ditemukan" }, { status: 404 });
  deleteLocalPost(post.id);
  return Response.json({ ok: true });
}
