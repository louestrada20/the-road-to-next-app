"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { signUpPath, ticketsPath } from "@/paths"

export function CTASection() {
  const { user, isFetched } = useAuth()

  return (
    <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-primary/10">
      <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
          Ready to Transform Your Workflow?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {user
            ? "Start managing tickets with bounties and collaborate with your team more effectively."
            : "Join teams already using TicketBounty to streamline their bug tracking and feature requests."}
        </p>

        {isFetched && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg" className="text-base">
                <Link href={ticketsPath()}>Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-base">
                <Link href={signUpPath()}>Get Started Free</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

