"use client"

import { useEffect, useRef, useState } from "react"

export function DoorHero() {
  const [open, setOpen] = useState(false)
  const openedRef = useRef(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      setOpen(true)
      openedRef.current = true
      return
    }
    const timer = setTimeout(() => {
      openedRef.current = true
      setOpen(true)
    }, 1400)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    openedRef.current = true
    setOpen(true)
  }

  return (
    <section className={`mrc-door-stage ${open ? "open" : ""}`} aria-label="McKinney Realty Co.">
      <div
        className="mrc-door-backdrop"
        style={{ backgroundImage: "url('/images/zip-codes/windermere.jpg')" }}
      />

      <div className="mrc-door-light" />

      <button
        type="button"
        onClick={handleEnter}
        className="mrc-door-leaf left"
        aria-label="Open the door to enter McKinney Realty Co."
      >
        <span className="mrc-door-panel" />
        <span className="mrc-door-handle" />
      </button>

      <button
        type="button"
        onClick={handleEnter}
        className="mrc-door-leaf right"
        aria-label="Open the door to enter McKinney Realty Co."
      >
        <span className="mrc-door-panel" />
        <span className="mrc-door-handle" />
      </button>

      <div className="mrc-door-crest">
        <img
          src="/images/mckinney-logo.jpg"
          alt="McKinney Realty Co."
          className="h-20 w-20 rounded-full object-cover ring-2 ring-[rgba(201,165,74,0.6)] shadow-[0_0_40px_rgba(201,165,74,0.35)]"
        />
        <p className="mrc-serif text-sm uppercase tracking-[0.45em] text-[var(--mrc-white)]/80">
          McKinney Realty Co.
        </p>
        <button
          type="button"
          onClick={handleEnter}
          className="mrc-enter-btn mt-2 rounded-sm px-8 py-3 text-xs font-medium uppercase"
        >
          Enter
        </button>
      </div>

      <div className="mrc-hero-reveal px-6">
        <p className="mrc-serif mb-3 text-xs uppercase tracking-[0.5em] text-[var(--mrc-gold-bright)]">
          Central Florida &middot; Luxury Real Estate
        </p>
        <h1 className="mrc-serif text-balance text-4xl font-semibold text-[var(--mrc-white)] sm:text-6xl md:text-7xl">
          Find Your <span className="mrc-gold-text italic">Dream Home</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-sm uppercase tracking-[0.25em] text-[var(--mrc-white)]/70 sm:text-base">
          We Don&rsquo;t Follow The Standard. We Make It.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contact"
            className="rounded-sm bg-[var(--mrc-gold)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mrc-navy-deep)] transition hover:bg-[var(--mrc-gold-bright)]"
          >
            Schedule Appointment
          </a>
          <a
            href="#story"
            className="rounded-sm border border-[var(--mrc-white)]/40 px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mrc-white)] transition hover:border-[var(--mrc-gold-bright)] hover:text-[var(--mrc-gold-bright)]"
          >
            Our Story
          </a>
        </div>
      </div>
    </section>
  )
}
