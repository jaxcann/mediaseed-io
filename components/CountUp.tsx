"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Final value to count up to */
  to: number;
  /** Duration in ms */
  duration?: number;
  /** Suffix appended after formatted number, e.g. "M+", "K", "x" */
  suffix?: string;
  /** Use compact formatting (1.2M instead of 1,200,000) */
  compact?: boolean;
  /** Decimals when compact (e.g. 1 → "1.2M") */
  decimals?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  to,
  duration = 1600,
  suffix = "",
  compact = true,
  decimals = 1,
  className = "",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // Starts at the final value so SSR output, crawlers, and no-JS readers get
  // the true stat; the observer resets to 0 the same frame the count begins.
  const [value, setValue] = useState(to);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            setValue(0);
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min((now - start) / duration, 1);
              setValue(to * easeOutCubic(t));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  const display = compact
    ? formatCompact(value, decimals)
    : Math.round(value).toLocaleString();

  const finalText =
    (compact ? formatCompact(to, decimals) : to.toLocaleString()) + suffix;

  return (
    <span
      ref={ref}
      className={`inline-block tabular-nums ${className}`}
      style={{ minWidth: `${finalText.length}ch` }}
    >
      {display}
      {suffix}
    </span>
  );
}

function formatCompact(n: number, decimals: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return Math.round(n).toString();
}
