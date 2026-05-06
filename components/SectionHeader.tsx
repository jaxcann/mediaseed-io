import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type Props = {
  eyebrow: string;
  heading: ReactNode;
  className?: string;
};

export function SectionHeader({ eyebrow, heading, className = "" }: Props) {
  return (
    <Reveal>
      <div className={`mb-10 sm:mb-14 md:mb-20 ${className}`}>
        <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-4 sm:mb-5 flex items-center gap-3">
          <span className="divider-line block h-px w-10 sm:w-12 bg-accent" />
          {eyebrow}
        </div>
        <h2 className="text-[clamp(2.25rem,7vw,4rem)] md:text-6xl font-medium tracking-tightest leading-[1.05] sm:leading-[1.02] max-w-3xl">
          {heading}
        </h2>
      </div>
    </Reveal>
  );
}
