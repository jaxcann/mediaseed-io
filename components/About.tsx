import { Reveal } from "./Reveal";

export function About() {
  return (
    <section id="about" className="py-16 sm:py-20 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-24">
      <div className="mx-auto max-w-content">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 md:gap-16">
          <div className="md:col-span-5">
            <Reveal>
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-4 sm:mb-5 flex items-center gap-3">
                <span className="divider-line block h-px w-10 sm:w-12 bg-accent" />
                About
              </div>
              <h2 className="text-[clamp(2.25rem,8vw,4rem)] md:text-6xl font-medium tracking-tightest leading-[1.02]">
                About.
              </h2>
              <p className="mt-6 sm:mt-8 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-muted-strong">
                Jax Cannon · Georgia
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-7 md:pt-2">
            <div className="space-y-6 sm:space-y-7 text-base sm:text-lg leading-relaxed text-fg/85 max-w-xl">
              <Reveal delay={80}>
                <p>
                  I&apos;m Jax Cannon, a creative and developer based in Georgia.
                  I work across a few disciplines that usually sit in separate
                  lanes: I shoot and edit video, run social, design and build
                  websites, and write the code for my own iOS apps. Mediaseed is
                  the name I make all of it under.
                </p>
              </Reveal>

              <Reveal delay={160}>
                <p>
                  The through-line is making things that grow. I started in
                  social and took an account from zero past a million views,
                  picked up a production credit on a regional TV show, and
                  taught myself to design and ship software along the way — one
                  app live in the App Store, more in progress.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <p>
                  I like owning the whole thing — the first frame to the shipped
                  build. This site is where all of it lives: the video work, the
                  apps, and a daily log of whatever I&apos;m making next. If
                  you&apos;ve got something worth building, I&apos;d love to hear
                  about it.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
