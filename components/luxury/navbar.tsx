"use client"

import { useEffect, useState } from "react"

const LINKS = [
  { href: "#story", label: "Our Story" },
  { href: "#services", label: "Buy / Sell" },
  { href: "#agents", label: "Agents" },
  { href: "#areas", label: "Areas We Serve" },
  { href: "#careers", label: "Careers" },
  { href: "#contact", label: "Contact" },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = "smooth"
    return () => {
      root.style.scrollBehavior = previous
    }
  }, [])

  return (
    <header className="mrc-navbar fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="#top" className="flex items-center gap-3">
          <img
            src="/images/mckinney-logo.jpg"
            alt="McKinney Realty Co."
            className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--mrc-gold)]/50"
          />
          <span className="mrc-serif hidden text-sm uppercase tracking-[0.3em] text-white sm:block">
            McKinney Realty Co.
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mrc-nav-link text-xs uppercase tracking-[0.15em]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="/auth/login"
            className="rounded-sm border border-[var(--mrc-gold)]/60 px-5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--mrc-gold-bright)] transition hover:bg-[var(--mrc-gold)]/10"
          >
            Agent Portal
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="h-px w-6 bg-[var(--mrc-gold-bright)]" />
          <span className="h-px w-6 bg-[var(--mrc-gold-bright)]" />
          <span className="h-px w-6 bg-[var(--mrc-gold-bright)]" />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[var(--mrc-gold)]/20 px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="mrc-nav-link text-sm uppercase tracking-[0.15em]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/auth/login"
              className="mt-1 rounded-sm border border-[var(--mrc-gold)]/60 px-5 py-2 text-center text-xs uppercase tracking-[0.2em] text-[var(--mrc-gold-bright)]"
            >
              Agent Portal
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
