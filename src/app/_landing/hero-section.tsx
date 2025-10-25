"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { organizationCreatePath, signInPath, signUpPath, ticketsPath } from "@/paths"

export function HeroSection() {
  const { user, isFetched } = useAuth()

  return (
    <section className="relative bg-gradient-to-br from-background via-secondary/30 to-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-from-top">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Turn Bugs Into <span className="text-primary">Bounties</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
            Incentivize ticket resolution with real rewards. Built for teams that ship fast.
            Multi-tenant ticketing system with bounty management, role-based permissions, and seamless collaboration.
          </p>

          {isFetched && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button asChild size="lg" className="text-base">
                    <Link href={ticketsPath()}>View My Tickets</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base">
                    <Link href={organizationCreatePath()}>Create Organization</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="text-base">
                    <Link href={signUpPath()}>Get Started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base">
                    <Link href={signInPath()}>Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

