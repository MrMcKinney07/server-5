import { Key, Home, Calculator } from "lucide-react"
import { Reveal } from "@/components/luxury/reveal"
import { TiltCard } from "@/components/luxury/tilt-card"

const SERVICES = [
  {
    icon: Home,
    title: "Buy a Home",
    copy: "From first search to closing day, we guide you through Central Florida's market with strategy, patience, and an agent who treats your search like it's the only one that matters.",
    cta: "Start Your Search",
    href: "#contact",
  },
  {
    icon: Key,
    title: "Sell Your Home",
    copy: "Strategic marketing, sharp negotiation, and relentless follow-through — we position your home to sell for what it's truly worth, with an unparalleled level of service.",
    cta: "Get a Home Valuation",
    href: "#contact",
  },
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    copy: "Run the numbers before you fall in love with a house. Estimate your monthly payment and see what fits your budget in minutes.",
    cta: "Calculate Payments",
    href: "#contact",
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-20 bg-[var(--mrc-ivory)] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mrc-serif text-xs uppercase tracking-[0.5em] text-[var(--mrc-navy)]">What We Do</p>
          <h2 className="mrc-serif mt-4 text-3xl text-[var(--mrc-ink)] sm:text-4xl">
            Real Estate, <span className="mrc-gold-text">Done Right</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={i * 120}>
              <TiltCard className="h-full rounded-sm border border-[var(--mrc-navy)]/10 bg-white p-8 shadow-[0_20px_50px_-25px_rgba(10,31,61,0.35)]">
                <service.icon className="h-9 w-9 text-[var(--mrc-gold)]" strokeWidth={1.5} />
                <h3 className="mrc-serif mt-6 text-xl text-[var(--mrc-ink)]">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mrc-ink)]/65">{service.copy}</p>
                <a
                  href={service.href}
                  className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mrc-navy)] underline decoration-[var(--mrc-gold)] decoration-2 underline-offset-4 transition hover:text-[var(--mrc-gold)]"
                >
                  {service.cta}
                </a>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
