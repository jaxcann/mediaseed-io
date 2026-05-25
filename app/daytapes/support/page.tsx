import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DayTapes — Support",
  description:
    "DayTapes support. Real human replies, usually within a day. Email hello@mediaseed.io.",
  alternates: { canonical: "/daytapes/support" },
};

type QA = { q: string; a: React.ReactNode };

const questions: QA[] = [
  {
    q: "Where are my photos and tapes stored?",
    a: "Entirely on your device, in DayTapes' private storage. They are never uploaded anywhere. That also means deleting the app deletes your tapes — back up anything precious by exporting it to Photos.",
  },
  {
    q: "How do I capture a loop, photo, or cut-out sticker?",
    a: (
      <>
        The camera has three modes you can switch between at the bottom:{" "}
        <strong>Photo</strong> (tap the shutter), <strong>Loop</strong> (press
        and <em>hold</em> for a 3-second living loop), and{" "}
        <strong>Cut</strong> (tap to capture, then DayTapes isolates the
        subject into a sticker you keep in your Collection).
      </>
    ),
  },
  {
    q: "What is the Collection?",
    a: "Every time you use the Cut mode, the resulting sticker lands in your Collection — a loose-leaf album of every object you've ever cut out. Open it from the toolbar (the scissors icon). Tap any sticker to view, rename, share, or delete it.",
  },
  {
    q: "What's the difference between the exports?",
    a: (
      <>
        <strong>Comic</strong> — a 1080×1350 comic-book page of your day,
        panels and all. <strong>Carousel</strong> — three scrapbook slides
        with subject cut-out stickers, glitter, and polychrome (built for
        Instagram). <strong>PunchCard</strong> — a 9:16 vertical tape of your
        day for Stories. The Live version animates your loops.{" "}
        <strong>Live Tape</strong> — a tall video that plays your whole day
        back as one continuous looping reel, saved to your camera roll.{" "}
        <strong>Tapegram</strong> — an animated 1080×1350 grid collage. Every
        loop alive.
      </>
    ),
  },
  {
    q: "Can I delete or rename a moment?",
    a: "Yes — tap any moment in your tape (or any sticker in your Collection) to open it, then add a caption, rename it, or delete it.",
  },
  {
    q: "How do I turn the daily reminder on or off?",
    a: "Open Settings (the slider icon) → Reminder. Pick the time, and DayTapes will only nudge you on days you haven't captured anything yet.",
  },
  {
    q: "What does Pro unlock? How much is it?",
    a: (
      <>
        Pro removes the daily capture cap, the Collection cap, and the
        DayTapes watermark, plus it enables Live exports (Live Comic, Live
        Carousel, Live PunchCard) and all premium sticker effects. Pricing:{" "}
        <strong>$4.99/month</strong> (3-day free trial),{" "}
        <strong>$39.99/year</strong> (save 33%), or <strong>$59.99 once</strong>{" "}
        for Lifetime. All purchases go through Apple's App Store.
      </>
    ),
  },
  {
    q: "I bought Pro on another device — how do I restore it?",
    a: "Open Settings → Restore Purchases, or tap \"Restore Purchases\" on the paywall. Make sure you're signed into the same Apple ID you used to purchase.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Subscriptions are managed by Apple. Open iPhone Settings → tap your name at the top → Subscriptions → DayTapes → Cancel. Your Pro access continues until the end of the current billing period.",
  },
  {
    q: "An export failed or the app felt slow on a big day.",
    a: "Very large days are memory-heavy to render — especially Live exports and Tapegrams. Make sure you're on the latest version, close other apps, and try again. If it keeps happening, email us with the rough number of moments that day.",
  },
];

export default function DayTapesSupport() {
  return (
    <>
      <header className="pt-[70px] pb-5">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
            Support
          </div>
          <h1 className="text-[clamp(2rem,6vw,2.5rem)] font-extrabold tracking-[-1px] mt-3.5">
            How can we help?
          </h1>
          <p className="text-white/60 text-[18px] mt-2">
            DayTapes is made by a tiny team. Real human replies, usually within a day.
          </p>
        </div>
      </header>

      <main className="pt-6 pb-24">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="bg-gradient-to-br from-daytapes-accent to-daytapes-accent-deep text-black rounded-[20px] px-7 py-8 my-2 mb-11">
            <h2 className="text-[22px] font-extrabold mb-1.5">Email us</h2>
            <p>
              The fastest way to reach us is{" "}
              <a
                href="mailto:hello@mediaseed.io"
                className="font-extrabold text-black underline underline-offset-2"
              >
                hello@mediaseed.io
              </a>
              . Tell us your device and iOS version and we'll sort it out.
            </p>
          </div>

          {questions.map(({ q, a }) => (
            <div key={q} className="border-b border-white/[0.08] py-[22px]">
              <h3 className="text-[18px] font-extrabold mb-2">{q}</h3>
              <p className="text-white/[0.72] leading-[1.65]">{a}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
