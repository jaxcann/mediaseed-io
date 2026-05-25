import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Lock } from "lucide-react";

export default function DayTapesHome() {
  return (
    <>
      {/* HERO */}
      <header className="relative text-center py-[90px] pb-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(232,116,60,0.16) 2.2px, transparent 2.6px)",
            backgroundSize: "40px 40px",
            WebkitMaskImage:
              "radial-gradient(120% 70% at 50% 8%, #000 0%, transparent 70%)",
            maskImage:
              "radial-gradient(120% 70% at 50% 8%, #000 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1100px] px-6">
          <div className="text-daytapes-accent font-extrabold tracking-[5px] text-[13px] uppercase mb-[22px]">
            A day in the life
          </div>
          <h1 className="text-[clamp(42px,7vw,82px)] font-extrabold leading-[1.02] tracking-[-2px]">
            Your whole day,
            <br />
            on <span className="text-daytapes-accent">one tape</span>.
          </h1>
          <p className="text-[clamp(17px,2.4vw,22px)] text-white/60 max-w-[620px] mx-auto mt-7 font-medium">
            Catch your day in tiny moments — photos, 3-second loops, and sticker
            cut-outs — that stitch into a tape you can play back, and turn into
            comics, carousels, PunchCards, Tapegrams, and Live Tapes worth
            sharing.
          </p>

          <div id="get" className="flex gap-3.5 justify-center flex-wrap mt-10">
            <a
              href="#"
              className="inline-flex items-center gap-2.5 font-bold text-[17px] px-[26px] py-4 rounded-[16px] bg-daytapes-accent text-black hover:-translate-y-0.5 transition-transform shadow-[0_14px_40px_rgba(232,116,60,0.35)] hover:shadow-[0_20px_50px_rgba(232,116,60,0.45)]"
            >
              <ArrowDown size={18} />
              Download on the App Store
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2.5 font-bold text-[17px] px-[26px] py-4 rounded-[16px] border-[1.5px] border-white/[0.18] text-white hover:border-daytapes-accent hover:text-daytapes-accent transition-colors"
            >
              See how it works
            </a>
          </div>
          <div className="text-[13px] text-white/40 mt-[18px] font-semibold tracking-[0.3px]">
            Free to start · Private by design · Nothing leaves your phone
          </div>

          {/* Hero phones */}
          <div className="flex justify-center items-end mt-[60px] relative z-10">
            <div className="relative z-[1] -mr-7">
              <Image
                src="/daytapes/hero-camera.png"
                alt="DayTapes capture screen — tap, hold, cut"
                width={420}
                height={910}
                priority
                className="w-[210px] sm:w-[210px] rounded-[36px] border border-white/[0.08] shadow-[0_40px_90px_rgba(0,0,0,0.55)] rotate-[-7deg] translate-y-6 hidden sm:block"
              />
            </div>
            <Image
              src="/daytapes/hero-tape.png"
              alt="A day tape — the whole day stitched in order"
              width={460}
              height={996}
              priority
              className="w-[230px] rounded-[36px] border border-white/[0.08] shadow-[0_40px_90px_rgba(0,0,0,0.55)] z-[3]"
            />
            <div className="relative z-[1] -ml-7">
              <Image
                src="/daytapes/hero-collection.png"
                alt="Collection — sticker album of subject cut-outs"
                width={420}
                height={910}
                priority
                className="w-[210px] rounded-[36px] border border-white/[0.08] shadow-[0_40px_90px_rgba(0,0,0,0.55)] rotate-[7deg] translate-y-6 hidden sm:block"
              />
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="py-24 bg-gradient-to-b from-daytapes-cream-soft to-daytapes-cream text-daytapes-ink scroll-mt-24"
      >
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="text-daytapes-accent-deep font-extrabold tracking-[4px] text-[12px] uppercase">
            How it works
          </div>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
            Tap. Hold. Cut.
          </h2>
          <p className="text-[18px] text-daytapes-ink/60 max-w-[560px] mt-4.5 font-medium">
            No feed. No followers. No pressure. Just open it through the day and
            catch what's happening — three modes, one shutter.
          </p>

          <div className="grid md:grid-cols-2 gap-16 items-center mt-16">
            <Image
              src="/daytapes/camera.png"
              alt="Capture a photo, loop, or cut-out"
              width={600}
              height={1300}
              className="w-full max-w-[300px] mx-auto rounded-[34px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-black/[0.06]"
            />
            <div>
              <div className="text-daytapes-accent-deep font-extrabold tracking-[4px] text-[12px] uppercase">
                Capture
              </div>
              <h3 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
                Tap. Hold. Cut.
              </h3>
              <p className="text-[18px] text-daytapes-ink/60 max-w-[560px] mt-4 font-medium">
                Tap for a photo. Hold for a 3-second living loop. Switch to Cut
                to isolate any subject — a coin, a receipt, a leaf — and save
                it as a sticker you keep forever.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mt-[90px]">
            <div className="md:order-2">
              <Image
                src="/daytapes/tape.png"
                alt="The day tape"
                width={600}
                height={1300}
                className="w-full max-w-[300px] mx-auto rounded-[34px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-black/[0.06]"
              />
            </div>
            <div className="md:order-1">
              <div className="text-daytapes-accent-deep font-extrabold tracking-[4px] text-[12px] uppercase">
                Play it back
              </div>
              <h3 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
                Your day spins
                <br />
                past like a roll.
              </h3>
              <p className="text-[18px] text-daytapes-ink/60 max-w-[560px] mt-4 font-medium">
                Every moment lands on your tape in order. Scroll the rolodex
                roll, or hit play and watch the whole day spin by — photos
                still, loops alive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection" className="py-24 bg-daytapes-ink scroll-mt-24">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
            A growing collection
          </div>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
            A sticker album
            <br />
            of your year.
          </h2>
          <p className="text-[18px] text-white/60 max-w-[560px] mt-4.5 font-medium">
            Every Cut you take lands in your Collection — a loose-leaf album of
            every object you thought was worth keeping. Coins, tickets, plants,
            takeout boxes. Stick it on a carousel later, or just keep it.
          </p>

          <div className="grid md:grid-cols-2 gap-16 items-center mt-16">
            <div>
              <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
                The collection
              </div>
              <h3 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
                Nothing else
                <br />
                does this.
              </h3>
              <p className="text-[18px] text-white/60 max-w-[560px] mt-4 font-medium">
                DayTapes is the only app that turns the things around you into
                a sticker library you can decorate, share, and revisit.
                Subjects get cleanly isolated on-device — no cloud, no upload,
                nothing to wait for.
              </p>
            </div>
            <Image
              src="/daytapes/collection.png"
              alt="Sticker album of cut-outs"
              width={600}
              height={1300}
              className="w-full max-w-[300px] mx-auto rounded-[34px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-white/[0.08]"
            />
          </div>
        </div>
      </section>

      {/* EXPORTS */}
      <section id="exports" className="py-24 bg-daytapes-ink scroll-mt-24">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
            Made to share
          </div>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
            Five ways to relive a day.
          </h2>
          <p className="text-[18px] text-white/60 max-w-[560px] mt-4.5 font-medium">
            One tap turns your day into something people actually stop
            scrolling for. Statics and lives both — no editing required.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mt-12">
            <ExportCard icon="📖" title="Comic">
              Your moments auto-composed into a comic-book page —
              orientation-aware panels, masthead, the works.
            </ExportCard>
            <ExportCard icon="🖼️" title="Carousel">
              Scrapbook slides with subject cut-out stickers, glitter, and
              polychrome. Built for IG.
            </ExportCard>
            <ExportCard icon="🎬" title="PunchCard">
              A 9:16 vertical tape of your day. Drop straight into Stories.
              Live version animates the loops.
            </ExportCard>
            <ExportCard icon="🎞️" title="Live Tape">
              A tall video that plays your whole day back as one continuous,
              looping reel — saved to your camera roll.
            </ExportCard>
            <ExportCard icon="✨" title="Tapegram">
              An animated 1080×1350 grid collage. Every loop alive, frozen at
              just the right moment.
            </ExportCard>
            <div className="flex flex-col justify-center bg-daytapes-accent/[0.12] border border-daytapes-accent/30 rounded-[20px] p-7">
              <h3 className="text-[19px] font-extrabold text-daytapes-accent-deep">
                …and your real days look better than these mockups.
              </h3>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mt-20">
            <Image
              src="/daytapes/comic.png"
              alt="Comic export"
              width={600}
              height={1300}
              className="w-full max-w-[300px] mx-auto rounded-[34px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-white/[0.08]"
            />
            <div>
              <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
                The comic
              </div>
              <h3 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
                A page from
                <br />
                your day.
              </h3>
              <p className="text-[18px] text-white/60 max-w-[560px] mt-4 font-medium">
                DayTapes lays your photos and loops into a comic page —
                orientation-aware panels, live loops embedded as motion, a
                clean masthead. Nothing else makes one.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mt-[90px]">
            <div className="md:order-2">
              <Image
                src="/daytapes/carousel.png"
                alt="Scrapbook carousel"
                width={600}
                height={1300}
                className="w-full max-w-[300px] mx-auto rounded-[34px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-white/[0.08]"
              />
            </div>
            <div className="md:order-1">
              <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
                The scrapbook
              </div>
              <h3 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1px] leading-[1.08] mt-3.5">
                Cut-outs
                <br />+ glitter.
              </h3>
              <p className="text-[18px] text-white/60 max-w-[560px] mt-4 font-medium">
                Drop your collected stickers onto polaroid carousels with
                hand-drawn glitter and polychrome detailing. Three slides,
                ready for the grid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVATE */}
      <section
        id="private"
        className="py-24 bg-gradient-to-b from-daytapes-cream-soft to-daytapes-cream text-daytapes-ink text-center scroll-mt-24"
      >
        <div className="mx-auto max-w-[1100px] px-6">
          <span className="inline-flex items-center gap-2 bg-daytapes-accent/[0.12] text-daytapes-accent-deep font-bold text-[13px] tracking-[0.5px] px-4 py-2.5 rounded-full border border-daytapes-accent/25">
            <Lock size={14} />
            Private by design
          </span>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold tracking-[-1px] leading-[1.08] mt-6">
            Your days stay yours.
          </h2>
          <p className="text-[18px] text-daytapes-ink/60 max-w-[560px] mx-auto mt-4.5 font-medium">
            No account. No cloud. No tracking, no ads, no analytics. Every
            photo, loop, and tape lives only on your device — full stop.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-28 bg-gradient-to-br from-daytapes-accent to-daytapes-accent-deep text-black">
        <div className="mx-auto max-w-[1100px] px-6">
          <h2 className="text-[clamp(34px,5vw,58px)] font-extrabold tracking-[-1px] leading-[1.08]">
            Start your first tape today.
          </h2>
          <p className="text-[19px] text-black/70 mt-3.5 font-semibold">
            One tape a day. Keep the moments that disappear.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2.5 font-bold text-[17px] px-[26px] py-4 rounded-[16px] bg-black text-daytapes-accent mt-9 hover:-translate-y-0.5 transition-transform shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
          >
            <ArrowDown size={18} />
            Download on the App Store
          </a>
          <p className="mt-[22px] text-[14px] text-black/55 font-semibold">
            Free to start · Unlock everything from <strong>$4.99/mo</strong>,{" "}
            <strong>$39.99/yr</strong>, or <strong>$59.99 once</strong>.
            <br />
            Live exports, unlimited captures, premium stickers, no watermark.
          </p>
        </div>
      </section>
    </>
  );
}

function ExportCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-[20px] p-7">
      <div className="w-[46px] h-[46px] rounded-[13px] bg-daytapes-accent/[0.14] flex items-center justify-center text-[22px] mb-4">
        {icon}
      </div>
      <h3 className="text-[19px] font-extrabold mb-1.5">{title}</h3>
      <p className="text-[14.5px] text-white/[0.62] leading-[1.5]">
        {children}
      </p>
    </div>
  );
}
