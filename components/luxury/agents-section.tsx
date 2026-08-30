import { Reveal } from "@/components/luxury/reveal"
import { TiltCard } from "@/components/luxury/tilt-card"

const AGENTS = [
  {
    name: "Matt McKinney",
    title: "Broker & Founder",
    bio: "Leads with high standards, structure, and a hands-on approach — focused on training agents and protecting clients at every step.",
  },
  {
    name: "Basel Elkomy",
    title: "Agent",
    bio: "Handles residential and commercial transactions across Central Florida with commercial-level negotiation, market insight, and hands-on care.",
  },
  {
    name: "Christy Noad",
    title: "Agent",
    bio: "Brings genuine care, patience, and positivity into every client interaction, with thoughtful, attentive service from start to finish.",
  },
  {
    name: "Cameo Barton",
    title: "Agent",
    bio: "An accounting graduate with an eye for detail who genuinely enjoys helping people find the right place to call home.",
  },
  {
    name: "Helena Arango",
    title: "Realtor",
    bio: "A wholesale background gives her a natural eye for value and opportunity, finding deals on and off the market.",
  },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

export function AgentsSection() {
  return (
    <section id="agents" className="mrc-navy-panel relative scroll-mt-20 py-28">
      <div className="mrc-divider absolute inset-x-0 top-0" />
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mrc-serif text-xs uppercase tracking-[0.5em] text-[var(--mrc-gold-bright)]">Meet The Team</p>
          <h2 className="mrc-serif mt-4 text-3xl text-[var(--mrc-white)] sm:text-4xl">Our Agents</h2>
        </Reveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent, i) => (
            <Reveal key={agent.name} delay={i * 90}>
              <TiltCard className="h-full rounded-sm border border-[var(--mrc-gold)]/20 bg-white/[0.04] p-7 backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--mrc-gold)]/50 bg-[var(--mrc-navy-mid)]">
                  <span className="mrc-serif text-lg text-[var(--mrc-gold-bright)]">{initials(agent.name)}</span>
                </div>
                <h3 className="mrc-serif mt-5 text-lg text-[var(--mrc-white)]">{agent.name}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--mrc-gold-bright)]">{agent.title}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--mrc-white)]/65">{agent.bio}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
