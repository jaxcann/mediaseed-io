"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "hero" | "ambient" | "tight";

type Props = {
  variant?: Variant;
  className?: string;
  bloomCount?: number;
};

const config: Record<
  Variant,
  { size: number; dotOpacity: number; dotRadius: number; mask: string }
> = {
  hero: {
    size: 28,
    dotOpacity: 0.09,
    dotRadius: 1,
    mask:
      "radial-gradient(ellipse 75% 65% at 50% 38%, black 12%, transparent 82%)",
  },
  ambient: {
    size: 32,
    dotOpacity: 0.06,
    dotRadius: 1,
    mask:
      "radial-gradient(ellipse 65% 70% at 50% 50%, black 10%, transparent 78%)",
  },
  tight: {
    size: 22,
    dotOpacity: 0.08,
    dotRadius: 0.9,
    mask:
      "radial-gradient(ellipse 90% 80% at 50% 50%, black 10%, transparent 85%)",
  },
};

// Stable pseudo-random positions seeded by index — same render on server + client
function seedPositions(count: number) {
  const dots: { top: string; left: string; delay: string; duration: string }[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 43758.5453;
    const c = Math.sin(i * 39.346) * 43758.5453;
    const d = Math.sin(i * 24.117) * 43758.5453;
    const top = `${(a - Math.floor(a)) * 88 + 6}%`;
    const left = `${(b - Math.floor(b)) * 88 + 6}%`;
    const delay = `${(c - Math.floor(c)) * 4}s`;
    const duration = `${4 + (d - Math.floor(d)) * 3}s`;
    dots.push({ top, left, delay, duration });
  }
  return dots;
}

export function DotField({
  variant = "hero",
  className = "",
  bloomCount = 9,
}: Props) {
  const cfg = config[variant];
  const [mounted, setMounted] = useState(false);
  const blooms = useRef(seedPositions(bloomCount));

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(250,250,250,${cfg.dotOpacity}) ${cfg.dotRadius}px, transparent ${cfg.dotRadius + 0.5}px)`,
          backgroundSize: `${cfg.size}px ${cfg.size}px`,
          maskImage: cfg.mask,
          WebkitMaskImage: cfg.mask,
        }}
      />
      {mounted &&
        blooms.current.map((b, i) => (
          <span
            key={i}
            className="absolute h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
            style={{
              top: b.top,
              left: b.left,
              animation: `dot-bloom ${b.duration} cubic-bezier(0.4, 0, 0.6, 1) ${b.delay} infinite`,
            }}
          />
        ))}
    </div>
  );
}
