import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="border-t border-border px-5 sm:px-6 md:px-10 pt-10 sm:pt-12 md:pt-16 pb-10 sm:pb-12 md:pb-16"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto max-w-content">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <Link
            href="/"
            className="font-mono text-sm tracking-tight lowercase text-fg hover:text-accent transition-colors"
          >
            mediaseed
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            <Link href="/apps" className="hover:text-fg transition-colors">
              Apps
            </Link>
            <Link href="/jaxlendar" className="hover:text-fg transition-colors">
              Jaxlendar
            </Link>
            <a href="/rebuild" className="hover:text-fg transition-colors">
              Rebuild
            </a>
            <a
              href="https://instagram.com/mediaseed"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fg transition-colors"
            >
              Instagram ↗
            </a>
            <a
              href="mailto:hello@mediaseed.io"
              className="hover:text-fg transition-colors"
            >
              Email
            </a>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong">
          <p>© 2026 Mediaseed. Made in Georgia.</p>
          <p>Always growing.</p>
        </div>
      </div>
    </footer>
  );
}
