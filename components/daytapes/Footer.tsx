import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function DayTapesFooter() {
  return (
    <footer
      className="bg-daytapes-ink py-14 border-t border-white/[0.06]"
      style={{
        paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto max-w-[1100px] px-6 flex flex-wrap items-center justify-between gap-5">
        <Wordmark className="text-[20px] text-white" />
        <nav className="flex items-center gap-6 text-[14px] font-semibold text-white/60">
          <Link href="/daytapes/privacy" className="hover:text-daytapes-accent hover:opacity-100 transition-colors">
            Privacy
          </Link>
          <Link href="/daytapes/support" className="hover:text-daytapes-accent hover:opacity-100 transition-colors">
            Support
          </Link>
          <a href="mailto:hello@mediaseed.io" className="hover:text-daytapes-accent hover:opacity-100 transition-colors">
            Contact
          </a>
          <Link href="/" className="hover:text-daytapes-accent hover:opacity-100 transition-colors">
            Mediaseed ↗
          </Link>
        </nav>
        <span className="text-[13px] text-white/40">© 2026 MediaSeed</span>
      </div>
    </footer>
  );
}
