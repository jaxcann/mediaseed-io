"use client";

import { useEffect, useRef } from "react";

/**
 * A yuruyurau-inspired generative particle field: thousands of tiny dots
 * braided into a flowing ribbon by layered trig waves, colored along an
 * iridescent pastel spectrum (cyan → lavender → pink, with peach strands),
 * softened by alpha trails on a cream ground.
 *
 * Perf: fillRect dots (no arcs), DPR capped, pauses offscreen/hidden,
 * renders a single static pass under prefers-reduced-motion.
 */

const CREAM = "#FAF6F0";
const TRAIL = "rgba(250, 246, 240, 0.085)";
const N = 2600;
const TAU = Math.PI * 2;

export function Particles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    let W = 0;
    let H = 0;
    let t = Math.random() * 100;
    let raf: number | null = null;
    let visible = true;
    let pageVisible = !document.hidden;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, W, H);
    };

    const step = () => {
      t += 0.0085;
      ctx.fillStyle = TRAIL;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < N; i++) {
        const u = i / N;
        const k = i % 5;
        const env = Math.sin(u * Math.PI); // pin ribbon ends to the edges

        const x = u * W;
        const y =
          H * 0.54 +
          Math.sin(u * TAU * 2.1 + t + k * 1.26) * H * 0.17 * env +
          Math.sin(u * TAU * 4.7 - t * 1.6 + k * 0.9) * H * 0.06 * env +
          Math.cos(u * TAU * 9.3 + t * 0.7 + k) * H * 0.02;

        if (k === 4) {
          // one peach strand woven through the spectrum
          ctx.fillStyle = "rgba(255, 154, 98, 0.4)";
        } else {
          // cyan (180) → lavender (260) → pink (340)
          const hue = 260 + 80 * Math.sin(u * Math.PI * 1.35 + t * 0.24 + k * 0.6);
          ctx.fillStyle = `hsla(${hue}, 80%, 66%, 0.5)`;
        }
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    };

    const loop = () => {
      if (!visible || !pageVisible) {
        raf = null;
        return;
      }
      step();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf === null && visible && pageVisible && !reduced) {
        raf = requestAnimationFrame(loop);
      }
    };

    resize();

    if (reduced) {
      // Settle into one dreamy static frame instead of animating.
      for (let f = 0; f < 260; f++) step();
    } else {
      start();
    }

    const onResize = () => {
      resize();
      if (reduced) for (let f = 0; f < 260; f++) step();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else if (raf !== null) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVis = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
