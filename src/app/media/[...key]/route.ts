import { signedUrl } from "@/lib/storage";

// Display URLs for <img>/<video>: redirect to a short-lived Wasabi link
// so media bytes don't pass through our server.
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const url = await signedUrl(key.join("/"));
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "public, max-age=3600" },
  });
}
