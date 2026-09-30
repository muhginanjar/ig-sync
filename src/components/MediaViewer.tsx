"use client";

import { useRef, useState } from "react";
import type { ShareFile } from "./types";

export default function MediaViewer({ items }: { items: ShareFile[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (i: number) =>
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" });

  return (
    <div className="relative bg-black">
      <div
        ref={track}
        onScroll={(e) =>
          setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
        }
        className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {items.map((item, i) =>
          item.type === "VIDEO" ? (
            <video
              key={item.id}
              src={item.displayUrl}
              controls
              playsInline
              preload="metadata"
              className="size-full shrink-0 snap-center object-contain"
            />
          ) : (
            <img
              key={item.id}
              src={item.displayUrl}
              alt={`Slide ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="size-full shrink-0 snap-center object-contain"
            />
          ),
        )}
      </div>

      {items.length > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {active + 1}/{items.length}
          </span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(i)}
                aria-label={`Ke slide ${i + 1}`}
                className={`size-1.5 rounded-full ${i === active ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
