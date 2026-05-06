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
                Why
                <br />
                Mediaseed.
              </h2>
              <p className="mt-6 sm:mt-8 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-muted-strong">
                Bonsai, not billboards.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-7 md:pt-2">
            <div className="space-y-6 sm:space-y-7 text-base sm:text-lg leading-relaxed text-fg/85 max-w-xl">
              <Reveal delay={80}>
                <p>
                  We're a small studio building social, content, and web for
                  practices that take the long view. The model is bonsai — we
                  start from seed, prune in the right places, and water the
                  account every day. The work compounds because someone is
                  actually paying attention to it, every week, for years.
                </p>
              </Reveal>

              <Reveal delay={160}>
                <p>
                  Founded by <span className="text-fg">Jax Cannon</span>, who
                  came up running social for Vascular Surgical Associates as
                  their first hire in the role and now produces in the field on
                  PBS's <span className="text-fg italic">Viewfinders</span>. We
                  work with practices across Georgia — the Atlanta metro and
                  its surrounding cities, Athens, and anywhere from the
                  mountains down to the coast.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <p>
                  We work best with practices that are willing to show up on
                  camera, trust a process that takes a few months to root, and
                  measure the right things. We're not a fit for accounts
                  chasing one viral post or a generic agency look. Patient
                  practices, patient growth.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
