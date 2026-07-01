"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export type LightboxItem =
  | { kind: "image"; src: string; alt?: string; caption?: string }
  | { kind: "video"; src: string; poster?: string; caption?: string };

export function Lightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4 sm:p-8 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-bg/60 text-fg hover:border-accent hover:text-accent transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <figure
        className="max-h-full max-w-5xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt={item.alt ?? ""}
            className="max-h-[82vh] w-auto max-w-full rounded-xl border border-border object-contain"
          />
        ) : (
          <video
            src={item.src}
            poster={item.poster}
            controls
            autoPlay
            playsInline
            className="max-h-[82vh] w-auto max-w-full rounded-xl border border-border"
          />
        )}
        {item.caption && (
          <figcaption className="mt-4 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong text-center">
            {item.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
