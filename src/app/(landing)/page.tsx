import type { Metadata } from "next"
import { CTASection } from "@/app/_landing/cta-section"
import { FeaturesSection } from "@/app/_landing/features-section"
import { HeroSection } from "@/app/_landing/hero-section"
import { StatsSection } from "@/app/_landing/stats-section"
import { TechStackSection } from "@/app/_landing/tech-stack-section"

export const metadata: Metadata = {
  title: "TicketBounty - Incentivize Bug Fixes With Real Rewards",
  description:
    "Modern ticket management system with bounty rewards. Built with Next.js 16, TypeScript, Prisma, and Stripe. Multi-tenant SaaS for teams.",
  keywords: ["ticket management", "bounty system", "bug tracking", "team collaboration", "saas"],
  openGraph: {
    title: "TicketBounty - Turn Bugs Into Bounties",
    description: "Incentivize ticket resolution with real rewards",
    type: "website",
    siteName: "TicketBounty",
  },
  twitter: {
    card: "summary_large_image",
    title: "TicketBounty",
    description: "Incentivize bug fixes with real rewards",
  },
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TechStackSection />
      <CTASection />

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "TicketBounty",
            applicationCategory: "BusinessApplication",
            description: "Modern ticket management system with bounty rewards for teams",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </div>
  )
}

