import type { Metadata, Viewport } from "next";
import { Mail, FileText, ArrowUpRight, Youtube, Smartphone, Plane, Clapperboard } from "lucide-react";
import { Particles } from "@/components/hq/Particles";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";

/*
  /barstool: a focused reel page for the Wonton Don + Drop A Pin producer role.
  Unlinked from the main site and noindexed. Travel-show work first.
*/

export const metadata: Metadata = {
  title: "Jax Cannon for Barstool",
  description:
    "Two years producing, shooting, and cutting a PBS travel series. Reel for the Wonton Don and Drop A Pin producer role in Chicago.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const episodes = [
  {
    id: "cnhqAJnWI-I",
    title: "Making a TV Show: View Finders Season 4, Episode 1",
    detail: "Behind the series. VFX, motion graphics, and post-production.",
  },
  {
    id: "TeopZ0a_93M",
    title: "Fall Photo Spots and How to Capture Them",
    detail: "Broadcast episode work: graphics, titles, and finish.",
  },
];

const travelReels = [
  {
    id: "vf-branson",
    title: "Necker Island with Richard Branson",
    detail: "View Finders on Necker Island, Season 4. Cut for Instagram, titles built in After Effects.",
  },
  {
    id: "lemurs",
    title: "Photographing lemurs on Necker Island",
    detail: "Field footage from the same shoot, cut vertical.",
  },
  {
    id: "vf-s5-where",
    title: "Season 5 teaser: where are we?",
    detail: "Season 5 promo, cut for Reels, September 2026.",
  },
  {
    id: "vf-s5-next",
    title: "Season 5 teaser: where next?",
    detail: "Looping branded promo for the show's channels.",
  },
];

const droneReels = ["drone-ridge", "drone-acadia", "drone-bridge", "drone-railway"];

const soloReels = [
  {
    id: "vsa-ultrasound",
    title: "Inside a venous duplex ultrasound",
    detail:
      "Walked into the exam room with a phone and a shot list, directed a tech who had never been on camera, cut the same day. 28,000 views and the most shared post on the account.",
    stat: "28,000 views",
  },
  {
    id: "jax-chia",
    title: "Giant chia pet",
    detail:
      "My own account: 25,000 followers and 1.9 million likes across 18 videos. This one did 4,000,000.",
    stat: "4,000,000 views",
  },
];

function VerticalVideo({
  id,
  title,
  detail,
  stat,
}: {
  id: string;
  title: string;
  detail: string;
  stat?: string;
}) {
  return (
    <figure className="group overflow-hidden rounded-2xl border-2 border-hq-ink/10 bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]">
      <div className="aspect-[9/16] bg-hq-ink/5">
        <video
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
          poster={`/media/reels/${id}.jpg`}
          aria-label={title}
        >
          <source src={`/media/reels/${id}.mp4`} type="video/mp4" />
        </video>
      </div>
      <figcaption className="p-4 sm:p-5">
        {stat && <div className="hq-eyebrow">{stat}</div>}
        <div className={`${stat ? "mt-2" : ""} text-base font-semibold tracking-tight`}>{title}</div>
        <p className="mt-1 text-sm text-hq-ink-soft leading-relaxed">{detail}</p>
      </figcaption>
    </figure>
  );
}

function Eyebrow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="hq-eyebrow mb-4 flex items-center gap-3">
      {icon}
      {children}
    </div>
  );
}

const h2 = "text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl";
const section = "py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10";

export default function BarstoolPage() {
  return (
    <main className="bg-hq-cream text-hq-ink">
      <section className="relative min-h-[88svh] flex flex-col justify-center overflow-hidden">
        <Particles className="absolute inset-0 h-full w-full" />
        <div className="relative mx-auto w-full max-w-content px-5 sm:px-6 md:px-10 pt-24 pb-12 text-center">
          <div className="hq-eyebrow animate-fade-up">For Barstool Sports · Wonton Don + Drop A Pin · Chicago</div>
          <h1
            className="mt-5 font-medium tracking-tightest leading-[0.95] text-[clamp(2.6rem,9vw,6.5rem)] animate-fade-up"
            style={{ animationDelay: "80ms", animationFillMode: "both", opacity: 0 }}
          >
            Two years on a travel show.
            <br />
            <span className="hq-grad-text py-[0.16em] -my-[0.16em] inline-block">Ready for yours.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-hq-ink-soft leading-relaxed animate-fade-up"
            style={{ animationDelay: "160ms", animationFillMode: "both", opacity: 0 }}
          >
            I am Jax Cannon. Since 2024 I have shot, cut, and animated for View Finders, a travel and
            photography series airing on PBS, and run its socials. Before that I built a surgical
            practice&apos;s channels from zero to more than 1,000,000 organic views on my own. I edit in
            Premiere, and I will be in Chicago.
          </p>
          <div
            className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 animate-fade-up"
            style={{ animationDelay: "240ms", animationFillMode: "both", opacity: 0 }}
          >
            <MagneticButton>
              <a
                href="mailto:jaxonkale124@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-hq-ink text-hq-cream px-6 py-4 sm:py-3.5 text-sm font-semibold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
              >
                <Mail size={15} />
                Email me
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="/resume.pdf"
                className="hq-grad-bg-soft inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
              >
                <FileText size={15} />
                Resume
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-hq-ink/20 px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-hq-ink"
              >
                <ArrowUpRight size={15} />
                Full portfolio
              </a>
            </MagneticButton>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className="mx-auto max-w-content">
          <Reveal>
            <Eyebrow icon={<Youtube size={13} className="text-hq-pink-deep" />}>View Finders on PBS</Eyebrow>
            <h2 className={h2}>Two seasons of run-and-gun, on air.</h2>
            <p className="mt-4 max-w-2xl text-base text-hq-ink-soft leading-relaxed">
              Small crew, real locations, tight turnarounds. I handle VFX, motion graphics, titles, and
              finish, and cut the social pieces that carry each episode online.
            </p>
          </Reveal>
          <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
            {episodes.map((v, i) => (
              <Reveal key={v.id} delay={(i % 2) * 80}>
                <figure className="group overflow-hidden rounded-2xl border-2 border-hq-ink/10 bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]">
                  <div className="aspect-video bg-hq-ink/5">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`}
                      title={v.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <figcaption className="p-5">
                    <div className="text-base sm:text-lg font-semibold tracking-tight">{v.title}</div>
                    <p className="mt-1 text-sm text-hq-ink-soft leading-relaxed">{v.detail}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={section}>
        <div className="mx-auto max-w-content">
          <Reveal>
            <Eyebrow icon={<Plane size={13} className="text-hq-pink-deep" />}>Travel, cut vertical</Eyebrow>
            <h2 className={h2}>Necker Island to New England.</h2>
          </Reveal>
          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {travelReels.map((r, i) => (
              <Reveal key={r.id} delay={(i % 4) * 60}>
                <VerticalVideo id={r.id} title={r.title} detail={r.detail} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 sm:mt-10">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {droneReels.map((id) => (
                <div key={id} className="aspect-[9/16] overflow-hidden rounded-xl border-2 border-hq-ink/10 bg-hq-ink/5">
                  <video
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={`/media/reels/${id}.jpg`}
                    aria-label="Fall drone reel"
                  >
                    <source src={`/media/reels/${id}.mp4`} type="video/mp4" />
                  </video>
                </div>
              ))}
            </div>
            <p className="hq-meta mt-3">Fall drone reels for Season 5. Shot and cut for the show&apos;s channels.</p>
          </Reveal>
        </div>
      </section>

      <section className={section}>
        <div className="mx-auto max-w-content">
          <Reveal>
            <Eyebrow icon={<Smartphone size={13} className="text-hq-pink-deep" />}>Solo, start to finish</Eyebrow>
            <h2 className={h2}>Shoot it, direct it, cut it, post it, read the numbers.</h2>
            <p className="mt-4 max-w-2xl text-base text-hq-ink-soft leading-relaxed">
              At Vascular Surgical Associates I was the only digital hire for a seven-location practice.
              I started the TikTok from zero, made all 109 posts, and ran five other platforms with it. More
              than 1,000,000 organic views, no paid spend.
            </p>
          </Reveal>
          <div className="mt-10 sm:mt-14 grid grid-cols-2 gap-4 sm:gap-5 max-w-2xl">
            {soloReels.map((r, i) => (
              <Reveal key={r.id} delay={(i % 2) * 80}>
                <VerticalVideo id={r.id} title={r.title} detail={r.detail} stat={r.stat} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`${section} pb-24`}>
        <div className="mx-auto max-w-content">
          <Reveal>
            <Eyebrow icon={<Clapperboard size={13} className="text-hq-pink-deep" />}>The short version</Eyebrow>
            <h2 className={h2}>I know the brands. I can be in Chicago.</h2>
            <p className="mt-4 max-w-2xl text-base text-hq-ink-soft leading-relaxed">
              Premiere and After Effects daily, DaVinci Resolve and Fusion for finish, Sony and iPhone in
              the field. Nights, weekends, and travel are the job on a travel show, and I have done two
              seasons of them.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <MagneticButton>
                <a
                  href="mailto:jaxonkale124@gmail.com"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-hq-ink text-hq-cream px-6 py-4 sm:py-3.5 text-sm font-semibold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                >
                  <Mail size={15} />
                  jaxonkale124@gmail.com
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-hq-ink/20 px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-hq-ink"
                >
                  <ArrowUpRight size={15} />
                  mediaseed.io
                </a>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
