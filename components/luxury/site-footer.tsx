import { Instagram, Facebook } from "lucide-react"

export function SiteFooter() {
  return (
    <footer id="contact" className="mrc-navy-panel relative border-t border-[var(--mrc-gold)]/20 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/images/mckinney-logo.jpg"
                alt="McKinney Realty Co."
                className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--mrc-gold)]/50"
              />
              <span className="mrc-serif text-sm uppercase tracking-[0.25em] text-white">McKinney Realty Co.</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              We Don&rsquo;t Follow The Standard. We Make It. Serving buyers and sellers across Central Florida.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--mrc-gold-bright)]">Schedule An Appointment</p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Ready to buy, sell, or just talk strategy? Reach out and a member of our team will follow up
              personally.
            </p>
            <a
              href="mailto:info@mckinneyrealtyco.com"
              className="mt-4 inline-block text-sm text-[var(--mrc-gold-bright)] underline decoration-[var(--mrc-gold)]/50 underline-offset-4"
            >
              info@mckinneyrealtyco.com
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--mrc-gold-bright)]">Follow Along</p>
            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://instagram.com/mckinneyrealtyco"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="McKinney Realty Co. on Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mrc-gold)]/40 text-[var(--mrc-gold-bright)] transition hover:bg-[var(--mrc-gold)]/10"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href="https://facebook.com/754391844416413"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="McKinney Realty Co. on Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mrc-gold)]/40 text-[var(--mrc-gold-bright)] transition hover:bg-[var(--mrc-gold)]/10"
              >
                <Facebook className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
            <a
              href="/auth/login"
              className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-white/50 underline decoration-white/20 underline-offset-4 transition hover:text-[var(--mrc-gold-bright)]"
            >
              Agent Portal Login
            </a>
          </div>
        </div>

        <div className="mrc-divider mt-12" />
        <p className="mt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} McKinney Realty Co. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
