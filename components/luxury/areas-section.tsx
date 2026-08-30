import { Reveal } from "@/components/luxury/reveal"

const AREAS = [
  { name: "Kissimmee", image: "/images/zip-codes/kissimmee.jpg" },
  { name: "Orlando", image: "/images/zip-codes/downtown-orlando.jpg" },
  { name: "Windermere", image: "/images/zip-codes/windermere.jpg" },
  { name: "Davenport", image: null },
  { name: "St. Cloud", image: null },
]

export function AreasSection() {
  return (
    <section id="areas" className="scroll-mt-20 bg-[var(--mrc-ivory)] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mrc-serif text-xs uppercase tracking-[0.5em] text-[var(--mrc-navy)]">Where We Work</p>
          <h2 className="mrc-serif mt-4 text-3xl text-[var(--mrc-ink)] sm:text-4xl">Areas We Serve</h2>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {AREAS.map((area, i) => (
            <Reveal key={area.name} delay={i * 80}>
              <div
                className={`mrc-area-card group flex aspect-[3/4] items-end rounded-sm ${
                  area.image ? "" : "mrc-navy-panel border border-[var(--mrc-gold)]/25"
                }`}
              >
                {area.image && (
                  <div
                    className="mrc-area-img absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${area.image}')` }}
                  />
                )}
                <span className="relative z-10 w-full p-5 text-center mrc-serif text-lg text-white">
                  {area.name}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
