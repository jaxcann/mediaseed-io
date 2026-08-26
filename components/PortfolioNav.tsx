"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#case-studies", label: "Case studies" },
  { href: "#motion", label: "Motion" },
  { href: "#games", label: "Games" },
  { href: "#apps", label: "Apps" },
  { href: "#about", label: "About" },
];

export function PortfolioNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
          scrolled || open
            ? "bg-hq-cream/85 backdrop-blur-md border-b border-hq-ink/10"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="mx-auto max-w-content px-5 sm:px-6 md:px-10">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-mono text-sm tracking-tight lowercase text-hq-ink"
              aria-label="Jax Cannon home"
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full hq-grad-bg" />
              jax cannon
            </Link>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-hq-ink-soft hover:text-hq-ink transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              <a
                href="mailto:jaxonkale124@gmail.com"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-hq-ink text-hq-cream hover:opacity-85 transition-opacity"
              >
                Email me
              </a>
            </nav>

            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center -mr-2.5 text-hq-ink"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-0 z-30 bg-hq-cream transition-[opacity,visibility] duration-300 ${
          open
            ? "opacity-100 visible pointer-events-auto"
            : "opacity-0 invisible pointer-events-none"
        }`}
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div
          className="flex flex-col h-full pt-24 px-5 sm:px-6"
          style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
        >
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[clamp(1.75rem,8vw,2rem)] font-semibold tracking-tight py-4 border-b border-hq-ink/10 text-hq-ink hover:text-hq-pink-deep transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:jaxonkale124@gmail.com"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex items-center justify-center text-base font-semibold px-6 py-4 rounded-full bg-hq-ink text-hq-cream"
            >
              Email me
            </a>
          </nav>
          <div className="mt-auto pt-8 font-mono text-xs text-hq-ink-soft">
            jaxonkale124@gmail.com · Athens, GA · open to remote
          </div>
        </div>
      </div>
    </>
  );
}
