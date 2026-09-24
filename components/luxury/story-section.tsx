import { Reveal } from "@/components/luxury/reveal"

export function StorySection() {
  return (
    <section id="story" className="mrc-navy-panel relative scroll-mt-20 overflow-hidden py-28">
      <div className="mrc-divider absolute inset-x-0 top-0" />
      <div className="mx-auto grid max-w-6xl gap-14 px-6 md:grid-cols-[0.85fr_1.15fr] md:items-center">
        <Reveal>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm border border-[var(--mrc-gold)]/30 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <img
              src="/images/zip-codes/dr-phillips.jpg"
              alt="Central Florida luxury home represented by McKinney Realty Co."
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 border-[10px] border-[var(--mrc-navy-deep)]/0" />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="mrc-serif text-xs uppercase tracking-[0.5em] text-[var(--mrc-gold-bright)]">Our Story</p>
          <h2 className="mrc-serif mt-4 text-3xl text-[var(--mrc-white)] sm:text-4xl">
            &ldquo;People deserve more.&rdquo;
          </h2>
          <div className="mt-6 space-y-5 text-pretty text-sm leading-relaxed text-[var(--mrc-white)]/75 sm:text-base">
            <p>
              Founder Matt McKinney built McKinney Realty Co. to get rid of the &ldquo;sink or swim&rdquo; model in
              real estate and replace it with real leadership, guidance, and support. Agents deserve mentorship and
              real opportunity. Clients deserve a team committed to excellence, integrity, and results.
            </p>
            <p>
              Our brokerage is built on training, support, and accountability &mdash; raising the standard of what a
              brokerage should be. Every listing is handled with care, strategy, and relentless follow-through,
              backed by deep knowledge of Central Florida&rsquo;s market dynamics.
            </p>
          </div>
          <p className="mrc-serif mt-8 text-sm italic text-[var(--mrc-gold-bright)]">&mdash; Matt McKinney, Broker &amp; Founder</p>
        </Reveal>
      </div>
    </section>
  )
}
