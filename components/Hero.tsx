import { ArrowRight } from "lucide-react";
import { DotField } from "./DotField";
import { MagneticButton } from "./MagneticButton";
import { CountUp } from "./CountUp";

export function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] flex flex-col justify-center px-5 sm:px-6 md:px-10 pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden"
    >
      <DotField variant="hero" bloomCount={11} />

      <div className="relative mx-auto w-full max-w-content">
        <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-6 sm:mb-8 animate-fade-in">
          <span className="inline-flex items-center gap-2.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping-soft" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Jax Cannon · Made in Georgia
          </span>
        </div>

        <h1 className="text-[clamp(2.5rem,10vw,8rem)] font-medium tracking-tightest leading-[0.98] sm:leading-[0.95] text-fg max-w-[18ch] sm:max-w-[15ch] animate-fade-up">
          <span className="md:block">I make things</span>{" "}
          <span className="md:block text-muted">that grow.</span>
        </h1>

        <p
          className="mt-8 sm:mt-10 text-base md:text-xl text-muted max-w-2xl leading-relaxed animate-fade-up"
          style={{ animationDelay: "120ms", animationFillMode: "both", opacity: 0 }}
        >
          I&apos;m Jax — I shoot and edit video, run social that&apos;s crossed a
          million views, build websites, and design and ship my own iOS apps.
          This is a portfolio of everything I make.
        </p>

        <div
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up"
          style={{ animationDelay: "240ms", animationFillMode: "both", opacity: 0 }}
        >
          <MagneticButton strength={10} className="w-full sm:w-auto">
            <a
              href="#work"
              className="group flex sm:inline-flex items-center justify-center gap-2 rounded-full bg-accent text-fg px-6 py-4 sm:py-3.5 text-sm font-medium hover:bg-accent-hover transition-colors w-full sm:w-auto"
            >
              See the work
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
          </MagneticButton>
          <MagneticButton strength={6} className="w-full sm:w-auto">
            <a
              href="#contact"
              className="flex sm:inline-flex items-center justify-center gap-2 rounded-full border border-border-strong text-fg px-6 py-4 sm:py-3.5 text-sm font-medium hover:border-accent hover:text-accent transition-colors w-full sm:w-auto"
            >
              Get in touch
            </a>
          </MagneticButton>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-content mt-16 sm:mt-24 md:mt-32">
        <div
          className="font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-muted-strong animate-fade-in flex flex-wrap items-center gap-x-3 gap-y-2"
          style={{ animationDelay: "360ms", animationFillMode: "both", opacity: 0 }}
        >
          <span>
            <CountUp to={1_200_000} compact decimals={1} suffix="+" duration={1800} /> views generated
          </span>
          <span
            className="hidden sm:inline-block h-1 w-1 rounded-full bg-border-strong"
            aria-hidden="true"
          />
          <span>Software in the App Store</span>
          <span
            className="hidden sm:inline-block h-1 w-1 rounded-full bg-border-strong"
            aria-hidden="true"
          />
          <span>Shipping daily</span>
        </div>
      </div>
    </section>
  );
}
