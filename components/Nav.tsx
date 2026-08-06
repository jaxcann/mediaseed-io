"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

type NavLink = { href: string; label: string };

const studioLinks: NavLink[] = [
  { href: "/#channels", label: "Channels" },
  { href: "/#drops", label: "Drops" },
  { href: "/#games", label: "Games" },
  { href: "/apps", label: "Apps" },
];

export function Nav() {
  const pathname = usePathname();
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const ctaHref = "/#contact";

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false; // anchors don't get active state
    return pathname === href;
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
          scrolled || open
            ? "bg-bg/85 backdrop-blur-md border-b border-border"
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
              className="font-mono text-sm tracking-tight lowercase text-fg hover:text-accent transition-colors"
              aria-label="Mediaseed home"
            >
              mediaseed
            </Link>

            <nav className="hidden md:flex items-center gap-5 lg:gap-8">
              {studioLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm transition-colors ${
                    isActive(l.href)
                      ? "text-fg"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <MagneticButton strength={6}>
                <Link
                  href={ctaHref}
                  className="text-sm font-medium px-4 py-2 rounded-full bg-fg text-bg hover:bg-accent hover:text-fg transition-colors inline-block"
                >
                  Say hi
                </Link>
              </MagneticButton>
            </nav>

            <button
              type="button"
              className="md:hidden p-2 -mr-2 text-fg"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        className={`md:hidden fixed inset-0 z-30 bg-bg transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div
          className="flex flex-col h-full pt-24 px-5 sm:px-6"
          style={{
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <nav className="flex flex-col gap-1">
            {studioLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[clamp(1.75rem,8vw,2rem)] tracking-tight py-4 border-b border-border text-fg hover:text-accent transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex items-center justify-center text-base font-medium px-6 py-4 rounded-full bg-fg text-bg hover:bg-accent hover:text-fg transition-colors"
            >
              Start a Project
            </Link>
          </nav>
          <div className="mt-auto pt-8 font-mono text-xs text-muted-strong">
            hello@mediaseed.io · a content network
          </div>
        </div>
      </div>
    </>
  );
}
