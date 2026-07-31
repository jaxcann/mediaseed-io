"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollProgress() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const el = barRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      el.style.transform = `scaleX(${ratio})`;
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // The DayTapes microsite has its own visual identity; the studio progress
  // bar would clash with the orange brand, so we hide it on those routes.
  if (pathname?.startsWith("/daytapes")) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 inset-x-0 z-50 h-px pointer-events-none"
    >
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{
          transform: "scaleX(0)",
          background:
            "linear-gradient(90deg, #E85DA8, #8B72EA 40%, #38B8D8 75%, #FF9A62)",
        }}
      />
    </div>
  );
}
