"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";

/** Spinner over a grid tile the moment it's tapped, until the post page shows. */
export default function TilePending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
      <LoaderCircle className="size-7 animate-spin text-white" />
    </span>
  );
}
