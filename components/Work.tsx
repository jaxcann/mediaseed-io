import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { Spotlight } from "./Spotlight";
import { ReelEmbed, type Reel } from "./ReelEmbed";

// Each entry can later carry a `videoSrc: "/videos/reel-XX.mp4"` (self-hosted, recommended)
// or a `reelId: "..."` (Instagram embed). With neither set, the tile renders the
// "Reel coming soon" placeholder.
const reels: Reel[] = [
  {
    client: "Vascular surgical practice",
    description: "Patient education reel — clinical content with a screen-stop hook.",
  },
  {
    client: "Vascular surgical practice",
    description: "Procedure explainer, written with the surgeons.",
  },
  {
    client: "Vascular surgical practice",
    description: "Recurring messaging series — built to compound week over week.",
  },
  {
    client: "Dentist",
    description: "Cosmetic case content shot on-site, structured for compliance.",
  },
  {
    client: "Dentist",
    description: "Family and comfort-care vignettes from the operatory.",
  },
  {
    client: "TV show",
    description: "Field shooting and post for an ongoing regional series.",
  },
];

export function Work() {
  return (
    <section id="work" className="py-16 sm:py-20 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-24">
      <div className="mx-auto max-w-content">
        <SectionHeader
          eyebrow="Work"
          heading={
            <>
              Selected work.
              <span className="text-muted"> A small wall of recent reels.</span>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {reels.map((reel, i) => (
            <Reveal key={`reel-${i}`} delay={(i % 3) * 80}>
              <Spotlight className="rounded-xl" size={420}>
                <ReelEmbed reel={reel} index={i + 1} total={reels.length} />
              </Spotlight>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-12 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong">
            Specific examples available on request — most work lives behind patient consent.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
