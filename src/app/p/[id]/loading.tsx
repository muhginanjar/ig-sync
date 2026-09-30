import { ChevronLeft, LoaderCircle } from "lucide-react";

// Shown instantly while a post page loads, mirroring its layout.
export default function Loading() {
  return (
    <div className="mx-auto max-w-xl pb-16" aria-busy="true" aria-label="Memuat post">
      <div className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-neutral-400">
        <ChevronLeft className="size-5" />
        Kembali
      </div>
      <div className="flex aspect-[4/5] items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <LoaderCircle className="size-8 animate-spin text-neutral-400" />
      </div>
      <div className="animate-pulse space-y-2 px-4 pt-4">
        <div className="h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          ))}
        </div>
        <div className="space-y-2 pt-6">
          <div className="h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
