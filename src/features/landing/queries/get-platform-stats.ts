import { cache } from "react"
import { prisma } from "@/lib/prisma"

// Using React cache for request-level memoization
// Will be upgraded to Next.js "use cache" once all routes have proper Suspense boundaries
export const getPlatformStats = cache(async () => {
  const [organizations, tickets, resolved, bounties] = await Promise.all([
    prisma.organization.count(),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "DONE" } }),
    prisma.ticket.aggregate({
      where: { status: "DONE" },
      _sum: { bounty: true },
    }),
  ])

  return {
    organizations,
    totalTickets: tickets,
    resolvedTickets: resolved,
    totalBounties: bounties._sum.bounty || 0,
    lastUpdated: new Date(),
  }
})

