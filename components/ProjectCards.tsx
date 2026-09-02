import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/*
  Project cards that look into the games and apps through barely-frosted glass.

  Every card is one <a>: the screenshot is the card background, a thin glass
  plate sits bottom-left and carries the copy, and the picture stays sharp
  everywhere outside the plate. Hover lifts the card (house move) and eases
  the picture up 3% over 700ms; reduced-motion keeps the picture still.
*/

type Tone = "light" | "dark";

export type GameProject = {
  name: string;
  tag: string;
  blurb: string;
  href: string;
  linkLabel: string;
  image: string;
  /** object-position for the cover crop, chosen per screenshot */
  position: string;
  /** light: dark ink on a white-tinted plate. dark: cream on an ink-tinted plate */
  tone: Tone;
};

export type AppProject = {
  name: string;
  tag: string;
  blurb: string;
  href: string;
  image: string;
  /** object-position inside the phone plate: which slice of the store shot shows */
  position: string;
  /** object-position for the blurred ambient: a slice that carries the app's color */
  glow: string;
  tone: Tone;
};

export const games: GameProject[] = [
  {
    name: "Daily Rebuild",
    tag: "Browser · Free · Daily",
    blurb:
      "The daily NBA GM puzzle. Take over a broken roster, work the trade machine, and rebuild your way back.",
    href: "https://dailyrebuild.app",
    linkLabel: "Play Daily Rebuild",
    image: "/media/rebuild.jpg",
    position: "30% 50%",
    tone: "dark",
  },
  {
    name: "Backyard",
    tag: "Browser · Free · vs bots",
    blurb:
      "Gym-class capture the flag, three on three. Free movement worth mastering, eight backyards to fight over, and a whole street of kids to unlock.",
    href: "/ctf",
    linkLabel: "Play Backyard",
    image: "/media/backyard.jpg",
    position: "50% 55%",
    tone: "light",
  },
];

export const apps: AppProject[] = [
  {
    name: "DayTapes",
    tag: "iOS · App Store",
    blurb:
      "Your whole day on one tape: photos, 3-second loops, and cut-out stickers. Private by design; nothing ever leaves your phone. I designed the tape metaphor, the sticker system, and the whole interface.",
    href: "https://apps.apple.com/us/app/daytapes/id6771819144",
    image: "/media/daytapes.jpg",
    position: "50% 100%",
    glow: "50% 0%",
    tone: "light",
  },
  {
    name: "Surgepod",
    tag: "iOS · App Store",
    blurb:
      "A focused music player with a tactile, hardware-inspired interface that keeps a history of everything you play. Built for people who miss holding their music: click wheel feel, modern guts.",
    href: "https://apps.apple.com/us/app/surgepod-track-your-listening/id6758268658",
    image: "/media/surgepod.jpg",
    position: "50% 0%",
    glow: "50% 100%",
    tone: "light",
  },
];

// ── Shared pieces ──────────────────────────────────────────────────────────

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const SIZES_FULL = "(min-width: 1280px) 1200px, 100vw";
const SIZES_HALF = "(min-width: 1280px) 590px, (min-width: 768px) 50vw, 100vw";
const SIZES_PHONE = "(min-width: 1280px) 290px, (min-width: 768px) 25vw, 56vw";

const shell = `group relative isolate block overflow-hidden rounded-3xl border-2 border-hq-ink/10 transition-[transform,box-shadow,border-color] duration-300 ${EASE} hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]`;

const glass: Record<
  Tone,
  { plate: string; eyebrow: string; title: string; body: string; link: string }
> = {
  light: {
    plate:
      "bg-white/55 group-hover:bg-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_10px_36px_rgba(20,19,25,0.10)]",
    eyebrow: "text-hq-ink-soft",
    title: "text-hq-ink",
    body: "text-hq-ink-soft",
    link: "text-hq-ink group-hover:text-hq-pink-deep",
  },
  dark: {
    plate:
      "bg-hq-ink/45 group-hover:bg-hq-ink/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_10px_36px_rgba(0,0,0,0.28)]",
    eyebrow: "text-hq-cream/65",
    title: "text-hq-cream",
    body: "text-hq-cream/75",
    link: "text-hq-cream group-hover:text-hq-pink",
  },
};

function Cover({
  src,
  position,
  sizes,
}: {
  src: string;
  position: string;
  sizes: string;
}) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        quality={82}
        className={`object-cover [@media(hover:hover)]:transform-gpu transition-transform duration-700 ${EASE} motion-safe:group-hover:scale-[1.03]`}
        style={{ objectPosition: position }}
      />
    </div>
  );
}

function Plate({
  tone,
  className = "",
  children,
}: {
  tone: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl backdrop-blur-[10px] backdrop-saturate-[1.3] transition-colors duration-300 ${glass[tone].plate} ${className}`}
    >
      {children}
    </div>
  );
}

function LinkRow({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-300 ${glass[tone].link}`}
    >
      {children}
      <ArrowUpRight
        size={14}
        className={`transition-transform duration-300 ${EASE} motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5`}
      />
    </span>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────

export function FairwaysFeature({ className = "" }: { className?: string }) {
  return (
    <a
      href="/fairways"
      className={`${shell} flex flex-col justify-end aspect-[3/4] sm:aspect-[4/3] md:aspect-[2/1] p-3 sm:p-4 md:p-5 bg-hq-cream-soft ${className}`}
    >
      <Cover src="/media/fairways.jpg" position="50% 55%" sizes={SIZES_FULL} />
      <Plate tone="light" className="p-6 sm:p-8 md:p-10 md:max-w-[560px]">
        <div className="hq-eyebrow">Browser · Free · Built with Three.js</div>
        <h3 className="mt-3 text-[clamp(2.25rem,8vw,4.5rem)] font-medium tracking-[-0.01em] leading-[0.95] uppercase text-hq-ink">
          Fairways
        </h3>
        <p className="mt-4 max-w-lg text-base md:text-lg text-hq-ink-soft leading-relaxed">
          Design, route, and run your own golf course. A full management sim
          with members, an economy, and tee sheets, wrapped around a course
          builder.
        </p>
        <span
          className={`mt-6 inline-flex items-center gap-2 rounded-full bg-hq-ink text-hq-cream px-6 py-3.5 text-sm font-bold transition-transform duration-300 ${EASE} motion-safe:group-hover:scale-105`}
        >
          Play Fairways
          <ArrowRight size={16} />
        </span>
      </Plate>
    </a>
  );
}

export function GameCard({ game }: { game: GameProject }) {
  const t = glass[game.tone];
  return (
    <a
      href={game.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shell} flex flex-col justify-end aspect-[4/5] md:aspect-[4/3] p-3 sm:p-4 ${
        game.tone === "dark" ? "bg-hq-ink" : "bg-hq-cream-soft"
      }`}
    >
      <Cover src={game.image} position={game.position} sizes={SIZES_HALF} />
      <Plate tone={game.tone} className="p-5 sm:p-6 md:max-w-[85%]">
        <div className={`hq-eyebrow ${t.eyebrow}`}>{game.tag}</div>
        <h3 className={`mt-2.5 text-2xl sm:text-3xl font-semibold tracking-tight ${t.title}`}>
          {game.name}
        </h3>
        <p className={`mt-2.5 text-sm sm:text-base leading-relaxed ${t.body}`}>
          {game.blurb}
        </p>
        <LinkRow tone={game.tone}>{game.linkLabel}</LinkRow>
      </Plate>
    </a>
  );
}

export function AppCard({ app }: { app: AppProject }) {
  const t = glass[app.tone];
  return (
    <a
      href={app.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shell} flex flex-col justify-end aspect-[4/5] md:aspect-[4/3] p-3 sm:p-4 bg-hq-cream-soft`}
    >
      {/* Ambient: the same store shot, tiny and blurred, so the card glows in the app's own colors */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <Image
          src={app.image}
          alt=""
          fill
          sizes="128px"
          quality={40}
          className="object-cover scale-[1.35] blur-2xl saturate-[1.5]"
          style={{ objectPosition: app.glow }}
        />
      </div>

      {/* Phone plate: sharp, tilted, bleeding off the right so the left stays clean for copy */}
      <div
        aria-hidden="true"
        className={`absolute top-[8%] -right-[7%] w-[56%] sm:w-[50%] md:w-[46%] aspect-[3/5] -rotate-6 rounded-2xl overflow-hidden ring-1 ring-white/50 shadow-[0_28px_70px_rgba(20,19,25,0.30)] [@media(hover:hover)]:transform-gpu transition-transform duration-700 ${EASE} motion-safe:group-hover:-translate-y-2`}
      >
        <Image
          src={app.image}
          alt=""
          fill
          sizes={SIZES_PHONE}
          quality={85}
          className="object-cover"
          style={{ objectPosition: app.position }}
        />
      </div>

      <Plate tone={app.tone} className="p-5 sm:p-6 lg:max-w-[60%]">
        <div className={`hq-eyebrow ${t.eyebrow}`}>{app.tag}</div>
        <h3 className={`mt-2.5 text-2xl sm:text-3xl font-semibold tracking-tight ${t.title}`}>
          {app.name}
        </h3>
        <p className={`mt-2.5 text-sm sm:text-base leading-relaxed ${t.body}`}>
          {app.blurb}
        </p>
        <LinkRow tone={app.tone}>Download on the App Store</LinkRow>
      </Plate>
    </a>
  );
}
