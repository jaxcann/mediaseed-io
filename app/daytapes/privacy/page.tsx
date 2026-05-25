import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DayTapes — Privacy Policy",
  description:
    "DayTapes does not collect, transmit, sell, or share any of your data. No accounts, no servers, no analytics, no tracking. Everything stays on your device.",
  alternates: { canonical: "/daytapes/privacy" },
};

export default function DayTapesPrivacy() {
  return (
    <>
      <header className="pt-[70px] pb-7">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="text-daytapes-accent font-extrabold tracking-[4px] text-[12px] uppercase">
            Privacy
          </div>
          <h1 className="text-[clamp(2rem,6vw,2.5rem)] font-extrabold tracking-[-1px] mt-3.5">
            Privacy Policy
          </h1>
          <div className="text-white/40 text-[14px] font-semibold mt-2">
            Last updated: May 25, 2026
          </div>
        </div>
      </header>

      <main className="pt-5 pb-24">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="bg-daytapes-accent/[0.1] border border-daytapes-accent/25 rounded-[16px] px-6 py-[22px] my-6 leading-[1.65]">
            <strong className="text-daytapes-accent">The short version:</strong>{" "}
            <span className="text-white/75">
              DayTapes does not collect, transmit, sell, or share any of your
              data. There are no accounts, no servers, no analytics, and no
              tracking. Every photo, loop, cut-out sticker, tape, and caption
              you create stays on your device. Subject isolation for cut-outs
              runs entirely on-device using Apple's Vision framework — no image
              is ever uploaded anywhere.
            </span>
          </div>

          <Section title="What we collect">
            Nothing. DayTapes has no user accounts and no backend servers. We
            do not collect personal information, usage analytics, advertising
            identifiers, location, or contacts.
          </Section>

          <Section title="Your photos, loops, and cut-outs">
            The photos, 3-second loops, and subject cut-out stickers you
            capture are stored locally in DayTapes' private storage on your
            device. They are never uploaded to us or anyone else. We never see
            them. Your Collection — the sticker album of everything you've cut
            out — is also entirely local.
          </Section>

          <Section title="Camera & microphone">
            DayTapes uses your camera and microphone only to capture the
            photos and loops you choose to take, on your device. Nothing is
            recorded or transmitted in the background.
          </Section>

          <Section title="On-device subject isolation">
            The "Cut" mode in DayTapes uses Apple's on-device Vision framework
            to isolate the subject of a photo into a sticker. This processing
            happens entirely on your iPhone — the image, the cut-out, and any
            intermediate data never leave your device. We do not use any
            third-party AI services or cloud-based image processing.
          </Section>

          <Section title="Photo library">
            When you export a Comic, Carousel, PunchCard, Live Tape, or
            Tapegram, DayTapes saves it to your Photos library — only at your
            request, and only the item you exported. We request "add only"
            access and never read your existing library.
          </Section>

          <Section title="Notifications">
            If you turn on the optional daily reminder, DayTapes schedules a
            local notification on your device. This never involves a server
            and sends no data anywhere.
          </Section>

          <Section title="Purchases & subscriptions">
            DayTapes is free to start. Pro features (Live exports, unlimited
            captures, premium sticker effects, watermark removal) can be
            unlocked via a Monthly subscription, Yearly subscription, or a
            one-time Lifetime purchase. All purchases are handled by Apple
            through the App Store using StoreKit — Apple receives the payment
            information directly, not DayTapes. We see only the
            receipt-validation result that tells the app whether to unlock Pro
            on this device. We do not store, log, or share any payment data.
          </Section>

          <Section title="Required-reason APIs">
            DayTapes uses a small number of standard Apple APIs (for app
            preferences and to check available disk space before an export)
            strictly to make the app function. These are declared in the app's
            privacy manifest and are never used for tracking.
          </Section>

          <Section title="Children">
            DayTapes does not collect data from anyone, including children. It
            is rated 4+.
          </Section>

          <Section title="Changes">
            If this policy ever changes, we'll update this page and the "last
            updated" date above.
          </Section>

          <Section title="Contact">
            Questions? Email{" "}
            <a
              href="mailto:hello@mediaseed.io"
              className="text-daytapes-accent"
            >
              hello@mediaseed.io
            </a>
            .
          </Section>
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className="text-[22px] font-extrabold mt-10 mb-2.5">{title}</h2>
      <p className="text-white/75 leading-[1.65] mb-3.5">{children}</p>
    </>
  );
}
