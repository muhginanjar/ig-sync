import { reminderIcs } from "@/lib/reminder";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** The domain the visitor is on, same as the Android/Google Calendar link uses. */
function visitorHost(req: Request) {
  // Behind Nginx/Cloudflare the original domain arrives as Host or X-Forwarded-Host.
  const raw = req.headers.get("x-forwarded-host")?.split(",")[0] ?? req.headers.get("host");
  const host = raw?.trim().toLowerCase();
  // Only a plain hostname[:port] may end up in the calendar text.
  if (host && /^[a-z0-9.-]+(:\d+)?$/.test(host)) return host;
  return (siteUrl() ?? new URL(req.url)).host;
}

export function GET(req: Request) {
  return new Response(reminderIcs(visitorHost(req)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="pengingat-posting.ics"',
      "Cache-Control": "no-store",
    },
  });
}
