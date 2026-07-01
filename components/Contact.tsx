import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { DotField } from "./DotField";

const fieldClass =
  "w-full bg-transparent border border-border rounded-lg px-4 py-3.5 text-fg placeholder:text-muted-strong text-base focus:outline-none focus:border-accent transition-colors";

const labelClass =
  "block font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong mb-2";

export function Contact() {
  return (
    <section id="contact" className="relative py-16 sm:py-20 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-24 overflow-hidden">
      <DotField variant="ambient" bloomCount={6} />
      <div className="relative mx-auto max-w-content">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 md:gap-16">
          <div className="md:col-span-5">
            <Reveal>
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-4 sm:mb-5 flex items-center gap-3">
                <span className="divider-line block h-px w-10 sm:w-12 bg-accent" />
                Contact
              </div>
              <h2 className="text-[clamp(2.25rem,8vw,4rem)] md:text-6xl font-medium tracking-tightest leading-[1.02]">
                Get in
                <br />
                touch.
              </h2>
              <p className="mt-6 sm:mt-8 text-base text-muted leading-relaxed max-w-md">
                Open to freelance work, collaborations, or just a conversation
                about something you&apos;re making. I read every message myself
                and usually reply within a day.
              </p>

              <div className="mt-10 sm:mt-12 space-y-3">
                <a
                  href="mailto:jax@mediaseed.io"
                  className="block font-mono text-sm text-fg hover:text-accent transition-colors"
                >
                  jax@mediaseed.io
                </a>
                <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong">
                  Based in Georgia · working with people anywhere
                </p>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-7">
            <Reveal delay={120}>
              <form
                action="mailto:jax@mediaseed.io"
                method="post"
                encType="text/plain"
                className="space-y-5 sm:space-y-6 rounded-xl border border-border bg-bg-elevated/40 p-5 sm:p-6 md:p-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Name
                    </label>
                    <input
                      id="name"
                      name="Name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="Email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@email.com"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className={labelClass}>
                    Company / context{" "}
                    <span className="text-muted-strong normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    id="company"
                    name="Company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Where you're coming from"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="message" className={labelClass}>
                    What&apos;s on your mind?
                  </label>
                  <textarea
                    id="message"
                    name="Message"
                    required
                    rows={5}
                    placeholder="A project, a collaboration, a question — whatever it is."
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-strong">
                    I usually reply within a day
                  </p>
                  <button
                    type="submit"
                    className="group flex sm:inline-flex items-center justify-center gap-2 rounded-full bg-accent text-fg px-6 py-4 sm:py-3.5 text-sm font-medium hover:bg-accent-hover transition-colors w-full sm:w-auto"
                  >
                    Send message
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
