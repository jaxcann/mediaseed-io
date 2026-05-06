import { Reveal } from "./Reveal";

const items = [
  {
    name: "Vascular surgical practice",
    detail: "Social + web · ongoing",
  },
  {
    name: "Dentist",
    detail: "Social · ongoing",
  },
  {
    name: "TV show",
    detail: "Production + post-production credit",
  },
];

export function ProofBar() {
  return (
    <section
      aria-label="Selected clients and credits"
      className="border-y border-border"
    >
      <div className="mx-auto max-w-content px-5 sm:px-6 md:px-10">
        <Reveal>
          <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {items.map((item) => (
              <li
                key={item.name}
                className="py-6 sm:py-8 md:py-10 md:px-8 first:md:pl-0 last:md:pr-0"
              >
                <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.16em] uppercase text-fg mb-2">
                  {item.name}
                </div>
                <div className="text-sm text-muted">{item.detail}</div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
