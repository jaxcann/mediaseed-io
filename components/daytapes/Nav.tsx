"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Wordmark";

type NavLink = { href: string; label: string };

const links: NavLink[] = [
  { href: "/daytapes#how", label: "How it works" },
  { href: "/daytapes#collection", label: "Collection" },
  { href: "/daytapes#exports", label: "Exports" },
  { href: "/daytapes#private", label: "Privacy" },
  { href: "/daytapes/support", label: "Support" },
];

export function DayTapesNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-[14px] bg-daytapes-ink/60 border-b border-white/[0.06]">
        <div
          className="mx-auto max-w-[1100px] px-6 h-16 flex items-center justify-between"
          style={{
            paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
            paddingRight: "max(1.5rem, env(safe-area-inset-right))",
          }}
        >
          <Link href="/daytapes" aria-label="DayTapes home">
            <Wordmark className="text-[20px]" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold text-white/70">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-daytapes-accent hover:opacity-100 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="#get"
            className="hidden sm:inline-flex items-center gap-2 font-bold text-[14px] bg-daytapes-accent text-black px-4 py-2.5 rounded-[14px] hover:-translate-y-0.5 transition-transform shadow-[0_10px_30px_rgba(232,116,60,0.3)]"
          >
            Get the app
          </Link>

          <button
            type="button"
            className="md:hidden p-2 -mr-2 text-white"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed inset-0 z-30 bg-daytapes-ink transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div
          className="flex flex-col h-full pt-24 px-6"
          style={{
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[clamp(1.75rem,8vw,2rem)] font-extrabold tracking-tight py-4 border-b border-white/[0.08] text-white hover:text-daytapes-accent transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="#get"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex items-center justify-center text-base font-bold px-6 py-4 rounded-[14px] bg-daytapes-accent text-black"
            >
              Get the app
            </Link>
          </nav>
          <div className="mt-auto pt-8 text-xs text-white/40 font-semibold">
            hello@mediaseed.io
          </div>
        </div>
      </div>
    </>
  );
}
