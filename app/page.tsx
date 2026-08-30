import type { Metadata } from "next"

import "./luxury-home.css"

import { Navbar } from "@/components/luxury/navbar"
import { DoorHero } from "@/components/luxury/door-hero"
import { StorySection } from "@/components/luxury/story-section"
import { ServicesSection } from "@/components/luxury/services-section"
import { AgentsSection } from "@/components/luxury/agents-section"
import { AreasSection } from "@/components/luxury/areas-section"
import { CareersSection } from "@/components/luxury/careers-section"
import { SiteFooter } from "@/components/luxury/site-footer"

export const metadata: Metadata = {
  title: "McKinney Realty Co. | Find Your Dream Home in Central Florida",
  description:
    "We Don't Follow The Standard. We Make It. McKinney Realty Co. helps you buy and sell homes across Kissimmee, Orlando, Davenport, St. Cloud, and Windermere.",
}

export default function HomePage() {
  return (
    <div id="top" className="mrc-site">
      <Navbar />
      <DoorHero />
      <StorySection />
      <ServicesSection />
      <AgentsSection />
      <AreasSection />
      <CareersSection />
      <SiteFooter />
    </div>
  )
}
