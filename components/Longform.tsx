import { Youtube } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/*
  Longform: full episodes and long-form pieces, embedded from YouTube.
  Sits directly under the Reels section. `id` is the YouTube video ID.
*/

export type LongformVideo = {
  id: string;
  title: string;
  client: string;
  detail: string;
};

export const longform: LongformVideo[] = [
  {
    id: "cnhqAJnWI-I",
    title: "Making a TV Show: View Finders Season 4, Episode 1",
    client: "View Finders on PBS",
    detail: "Behind the series. VFX, motion graphics, and post-production.",
  },
  {
    id: "TeopZ0a_93M",
    title: "Fall Photo Spots and How to Capture Them",
    client: "View Finders on PBS",
    detail: "Broadcast episode work: graphics, titles, and finish.",
  },
  {
    id: "BnSueJVW1ko",
    title: "The Buzzer Beater That Saved Thousands From a Tornado",
    client: "Cinderella Sports",
    detail: "Written, edited, and animated solo. A sports story told like a film.",
  },
  {
    id: "855lC9DyjX8",
    title: "He Has a Bonsai Nursery in His Backyard",
    client: "Personal channel",
    detail: "Shot, cut, and colored solo. A short documentary portrait.",
  },
];

export function Longform() {
  return (
    <section
      id="longform"
      className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
    >
      <div className="mx-auto max-w-content">
        <Reveal>
          <div className="hq-eyebrow mb-4 flex items-center gap-3">
            <Youtube size={13} className="text-hq-pink-deep" />
            Longform
          </div>
          <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl">
            Worth the full watch.
          </h2>
        </Reveal>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {longform.map((v, i) => (
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
                  <div className="hq-eyebrow">{v.client}</div>
                  <div className="mt-2 text-base sm:text-lg font-semibold tracking-tight">
                    {v.title}
                  </div>
                  <p className="mt-1 text-sm text-hq-ink-soft leading-relaxed">
                    {v.detail}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
