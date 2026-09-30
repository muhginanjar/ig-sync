import { adminGuard } from "@/lib/auth";
import { handle } from "@/lib/api";
import { createLocalPost } from "@/lib/local-posts";

// Step 2 of a new post: record it once every file is in Wasabi.
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  return handle(async () => {
    const id = await createLocalPost(await req.json());
    return Response.json({ id });
  });
}
