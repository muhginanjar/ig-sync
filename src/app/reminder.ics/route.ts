import { reminderIcs } from "@/lib/reminder";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const host = new URL(process.env.SITE_URL ?? req.url).host;
  return new Response(reminderIcs(host), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="pengingat-posting.ics"',
      "Cache-Control": "no-store",
    },
  });
}
