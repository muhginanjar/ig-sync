// Daily "go post" reminder, added to the visitor's phone calendar.
// Shared by the .ics route (Apple) and the Google Calendar link (Android).

export const REMINDER_TZ = "Asia/Jakarta";
const START = "100000"; // 10:00 local time
const END = "101500"; // 15-minute block

export function reminderText(host: string) {
  return {
    title: `Posting dari ${host} ke semua lini`,
    details: `Buka https://${host}, pilih postingan, lalu bagikan ke semua lini (WhatsApp, Facebook, TikTok, Instagram, dll).`,
    url: `https://${host}`,
  };
}

/** Today's date in Jakarta as YYYYMMDD, so the first reminder is today/tomorrow. */
function todayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: REMINDER_TZ })
    .format(new Date())
    .replaceAll("-", "");
}

export function googleCalendarUrl(host: string) {
  const { title, details } = reminderText(host);
  const day = todayInJakarta();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${day}T${START}/${day}T${END}`,
    ctz: REMINDER_TZ,
    recur: "RRULE:FREQ=DAILY",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const escapeIcs = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

const bytes = (s: string) => new TextEncoder().encode(s).length;

/** RFC 5545 wants lines of at most 75 octets, continued with a leading space. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (bytes(rest) > 75) {
    let cut = 75;
    while (bytes(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function reminderIcs(host: string) {
  const { title, details, url } = reminderText(host);
  const day = todayInJakarta();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ig-sync//reminder//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${REMINDER_TZ}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:WIB",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:daily-post-reminder@${host}`, // same UID → re-adding updates instead of duplicating
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${REMINDER_TZ}:${day}T${START}`,
    `DTEND;TZID=${REMINDER_TZ}:${day}T${END}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0M",
    `DESCRIPTION:${escapeIcs(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}
