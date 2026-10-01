import { reminderIcs } from "@/lib/reminder";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const host = (siteUrl() ?? new URL(req.url)).host;
  return new Response(reminderIcs(host), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="pengingat-posting.ics"',
      "Cache-Control": "no-store",
    },
  });
}
