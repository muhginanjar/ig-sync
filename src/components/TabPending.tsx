"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";

/** Small spinner inside a tab while its list loads. */
export default function TabPending() {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle className="size-3.5 animate-spin" /> : null;
}
