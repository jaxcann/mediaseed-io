"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function CursorFollower() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible) setVisible(true);

      const t = e.target as HTMLElement | null;
      const interactive = t?.closest(
        "a, button, [role='button'], input, textarea, select, [data-cursor='hover']",
      );
      setHovering(Boolean(interactive));
    };

    const onLeave = () => setVisible(false);

    const tick = () => {
      const k = 0.18;
      current.current.x += (target.current.x - current.current.x) * k;
      current.current.y += (target.current.y - current.current.y) * k;
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate3d(${current.current.x - 6}px, ${current.current.y - 6}px, 0) scale(${hovering ? 2.2 : 1})`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, hovering]);

  // The DayTapes microsite has its own visual identity; the studio cursor
  // dot would clash with the orange brand, so we hide it on those routes.
  if (pathname?.startsWith("/daytapes")) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 left-0 z-[60] h-3 w-3 rounded-full bg-fg mix-blend-difference transition-[opacity,scale] duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    />
  );
}
