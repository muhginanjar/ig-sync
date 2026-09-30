import { getMedia } from "@/lib/posts";
import { getObject } from "@/lib/storage";

// Same-origin file stream used by the Share button (Web Share needs the
// actual bytes, and fetching them from Wasabi directly would hit CORS).
export async function GET(req: Request, ctx: RouteContext<"/api/file/[id]">) {
  const { id } = await ctx.params;
  const media = getMedia(id);
  if (!media) return new Response("Not found", { status: 404 });

  const obj = await getObject(media.key);
  const filename = `infimate-${media.postId}-${media.position + 1}.${media.key.split(".").pop()}`;
  const download = new URL(req.url).searchParams.has("download");

  return new Response(obj.Body!.transformToWebStream(), {
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(media.sizeBytes),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
