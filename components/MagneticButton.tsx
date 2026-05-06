"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum px the inner content can drift toward the cursor */
  strength?: number;
  /** Distance (px) from element edge at which the magnetic effect activates */
  range?: number;
};

export function MagneticButton({
  children,
  className = "",
  strength = 8,
  range = 80,
}: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let raf: number | null = null;
    let tx = 0;
    let ty = 0;

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach =
        Math.max(rect.width, rect.height) / 2 + range;

      if (dist > reach) {
        tx = 0;
        ty = 0;
      } else {
        const pull = 1 - dist / reach;
        tx = dx * pull * (strength / 30);
        ty = dy * pull * (strength / 30);
      }

      if (raf === null) {
        raf = requestAnimationFrame(() => {
          inner.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          raf = null;
        });
      }
    };

    const reset = () => {
      tx = 0;
      ty = 0;
      inner.style.transform = "translate3d(0, 0, 0)";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", reset);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", reset);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [range, strength]);

  return (
    <span ref={wrapRef} className={`inline-block ${className}`}>
      <span
        ref={innerRef}
        className="inline-block transition-transform duration-300 ease-out will-change-transform"
      >
        {children}
      </span>
    </span>
  );
}
