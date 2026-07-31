const items = [
  "INMOGNITO",
  "MOSTREMOTE",
  "OTP DAILY DOODLES",
  "CINDERELLA SPORTS",
  "LIGHTSWITCHED",
  "DAILY REBUILD",
  "SURGEPOD",
  "DAYTAPES",
  "JAXLENDAR",
];

function Run({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6 sm:px-8 font-mono text-[11px] sm:text-xs tracking-[0.22em] text-hq-ink-soft whitespace-nowrap">
            {item}
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #E85DA8, #8B72EA 50%, #38B8D8)",
            }}
          />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="hq-marquee overflow-hidden border-y border-hq-ink/10 py-4 bg-hq-cream-soft/60">
      <div className="hq-marquee-track flex w-max">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
