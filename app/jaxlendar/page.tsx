import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DotField } from "@/components/DotField";
import { Jaxlendar } from "@/components/jaxlendar/Jaxlendar";

export const metadata: Metadata = {
  title: "Jaxlendar — the Mediaseed shipping log",
  description:
    "A running calendar of everything shipped out of the Mediaseed network — one entry a day, media and all.",
  openGraph: {
    type: "website",
    url: "https://mediaseed.io/jaxlendar",
    title: "Jaxlendar — the Mediaseed shipping log",
    description:
      "A running calendar of everything the Mediaseed network ships — one entry a day.",
  },
  alternates: { canonical: "/jaxlendar" },
};

export default function JaxlendarPage() {
  return (
    <>
      <Nav />
      <main>
        <section
          id="top"
          className="relative pt-32 sm:pt-36 md:pt-44 pb-8 sm:pb-10 px-5 sm:px-6 md:px-10 overflow-hidden"
        >
          <DotField variant="hero" bloomCount={8} />
          <div className="relative mx-auto w-full max-w-content">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-6 sm:mb-8 animate-fade-in">
              <span className="inline-flex items-center gap-2.5">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-accent animate-ping-soft" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Shipping in public
              </span>
            </div>

            <h1 className="text-[clamp(2.5rem,9vw,6rem)] font-medium tracking-tightest leading-[1.02] sm:leading-[0.98] text-fg max-w-[16ch] animate-fade-up">
              The <span className="text-accent">Jaxlendar</span>.
            </h1>

            <p
              className="mt-6 sm:mt-8 text-base md:text-xl text-muted max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "120ms", animationFillMode: "both", opacity: 0 }}
            >
              A running calendar of everything the network ships — one entry a
              day, media and all. Tap any lit-up day to see what came out of
              it.
            </p>
          </div>
        </section>

        <section className="pb-20 sm:pb-24 md:pb-32 px-5 sm:px-6 md:px-10">
          <div className="mx-auto w-full max-w-content">
            <Jaxlendar />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
