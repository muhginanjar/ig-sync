import { adminGuard } from "@/lib/auth";
import { handle } from "@/lib/api";
import { prepareUploads } from "@/lib/local-posts";

// Step 1 of a new post: presigned URLs so the browser uploads straight to Wasabi.
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  return handle(async () => {
    const body: { files?: { contentType: string }[] } = await req.json();
    return Response.json(await prepareUploads(body.files ?? []));
  });
}
