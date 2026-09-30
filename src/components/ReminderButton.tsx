"use client";

import { CalendarPlus } from "lucide-react";
import { googleCalendarUrl } from "@/lib/reminder";

export default function ReminderButton({ className }: { className?: string }) {
  function addReminder() {
    // iOS/iPadOS/macOS open .ics files straight into Apple Calendar.
    // Android's Google Calendar doesn't import .ics, so use its web template.
    if (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
      // A file download, not a Next.js page, so plain navigation is intended.
      window.location.assign(new URL("/reminder.ics", window.location.origin));
    } else {
      window.open(googleCalendarUrl(window.location.host), "_blank", "noopener");
    }
  }

  return (
    <button onClick={addReminder} className={className} title="Pengingat posting setiap hari jam 10:00">
      <CalendarPlus className="size-4" />
      <span className="sm:hidden">Pengingat</span>
      <span className="hidden sm:inline">Pengingat 10:00</span>
    </button>
  );
}
