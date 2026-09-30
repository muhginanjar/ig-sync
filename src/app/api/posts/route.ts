import { pageOfTab, tabOf } from "@/lib/tabs";

// Next page of the grid for infinite scroll: /api/posts?tab=video&offset=24
export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const offset = Math.max(0, Number(params.get("offset")) || 0);
  return Response.json(pageOfTab(tabOf(params.get("tab")).id, offset));
}
