"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Set once the visitor has moved between pages inside this app, so "back"
// stays in the app instead of leaving it (e.g. when opened from a shared link).
let navigatedInApp = false;

/** Mounted in the root layout; watches client-side route changes. */
export function NavigationTracker() {
  const pathname = usePathname();
  const first = useRef(pathname);
  useEffect(() => {
    if (pathname !== first.current) navigatedInApp = true;
  }, [pathname]);
  return null;
}

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      // History back returns to the grid at the same scroll position.
      onClick={() => (navigatedInApp ? router.back() : router.push("/"))}
      className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
    >
      <ChevronLeft className="size-5" />
      Kembali
    </button>
  );
}
