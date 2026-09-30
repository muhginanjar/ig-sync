"use client";

import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { ShareFile } from "./types";

/** One slide with its own spinner, hidden once the media can be shown. */
function Slide({ item, index }: { item: ShareFile; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const done = () => setLoaded(true);

  return (
    <div className="relative size-full shrink-0 snap-center">
      {!loaded && (
        <LoaderCircle className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-white/60" />
      )}
      {item.type === "VIDEO" ? (
        <video
          src={item.displayUrl}
          controls
          playsInline
          preload="metadata"
          // iOS shows no frame before play, so metadata is the "ready" signal.
          onLoadedMetadata={done}
          onError={done}
          className="relative size-full object-contain"
        />
      ) : (
        <img
          // Cached images can finish before React hydrates and never fire onLoad.
          ref={(el) => {
            if (el?.complete) done();
          }}
          src={item.displayUrl}
          alt={`Slide ${index + 1}`}
          loading={index === 0 ? "eager" : "lazy"}
          onLoad={done}
          onError={done}
          className="relative size-full object-contain"
        />
      )}
    </div>
  );
}

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
        {items.map((item, i) => (
          <Slide key={item.id} item={item} index={i} />
        ))}
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
