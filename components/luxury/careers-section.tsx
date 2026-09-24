import { Reveal } from "@/components/luxury/reveal"

export function CareersSection() {
  return (
    <section id="careers" className="relative scroll-mt-20 overflow-hidden bg-[var(--mrc-ivory)] py-24">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <div className="mrc-navy-panel rounded-sm border border-[var(--mrc-gold)]/25 px-8 py-14 text-center sm:px-16">
            <p className="mrc-serif text-xs uppercase tracking-[0.5em] text-[var(--mrc-gold-bright)]">
              Join The Team
            </p>
            <h2 className="mrc-serif mt-4 text-3xl text-[var(--mrc-white)] sm:text-4xl">We&rsquo;re Hiring</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--mrc-white)]/70">
              Agents deserve mentorship, structure, and real opportunity. If you&rsquo;re ready to build a career with
              a brokerage that invests in you, we&rsquo;d love to see your resume.
            </p>
            <a
              href="https://mckinneyrealtyco.com/careers"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-sm bg-[var(--mrc-gold)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mrc-navy-deep)] transition hover:bg-[var(--mrc-gold-bright)]"
            >
              Apply Now
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
