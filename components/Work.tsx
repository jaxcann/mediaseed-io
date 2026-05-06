import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { Spotlight } from "./Spotlight";
import { ReelEmbed, type Reel } from "./ReelEmbed";

const reels: Reel[] = [
  {
    client: "Vascular Surgical Associates",
    handle: "vascularsurgicalatl",
    description:
      "\"Prevention is powerful.\" A flagship messaging reel reframing vascular care from reactive to proactive.",
    metric: "Series anchor · written with the surgeons",
    reelId: "DJciayBvtxm",
  },
  {
    client: "Vascular Surgical Associates",
    handle: "vascularsurgicalatl",
    description:
      "Patient education on clotted dialysis access — a niche topic, written so it actually lands.",
    metric: "Top patient-education performer",
    reelId: "DKNWHQ_vx4j",
  },
  {
    client: "Vascular Surgical Associates",
    handle: "vascularsurgicalatl",
    description:
      "A quick look at carotid arteries, in 30 seconds. Clinical content with a screen-stop hook.",
    metric: "Driver of new screening inquiries",
    reelId: "DKRmrFHATbo",
  },
  {
    client: "AllSmiles Family & Cosmetic Dentistry",
    handle: "allsmilesnorthga",
    description:
      "Cosmetic case content for AllSmiles in Cumming — the visual rebuild from the ground up.",
    metric: "4.2× follower growth · 6 months",
  },
  {
    client: "AllSmiles Family & Cosmetic Dentistry",
    handle: "allsmilesnorthga",
    description:
      "Family and comfort-care vignettes shot on-site, structured around dental compliance.",
    metric: "26 booked consults from social",
  },
  {
    client: "View Finders (PBS)",
    handle: "viewfinderstv",
    description:
      "Field shooting and post for the Emmy-nominated PBS series with Chris Greer & Paul Daniel.",
    metric: "Air date: PBS · Create TV",
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
              <span className="text-muted"> Reels and stories shipped over the last year.</span>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {reels.map((reel, i) => (
            <Reveal key={`${reel.handle}-${i}`} delay={(i % 3) * 80}>
              <Spotlight className="rounded-xl" size={420}>
                <ReelEmbed reel={reel} index={i + 1} total={reels.length} />
              </Spotlight>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-12 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong">
            Tap any tile to play. More on request — much of our best work lives behind patient consent.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
