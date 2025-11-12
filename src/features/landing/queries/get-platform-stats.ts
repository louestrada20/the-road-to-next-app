import { cache } from "react"
import { prisma } from "@/lib/prisma"

// Using React cache for request-level memoization
// Will be upgraded to Next.js "use cache" once all routes have proper Suspense boundaries
export const getPlatformStats = cache(async () => {
  // Optimized for serverless: reduced from 4 to 2 concurrent connections
  // Combines resolved count + bounty sum into single aggregate query
  const [organizations, resolvedStats] = await Promise.all([
    prisma.organization.count(),
    prisma.ticket.aggregate({
      where: { status: "DONE" },
      _count: true,
      _sum: { bounty: true },
    }),
  ])

  // Separate query for total tickets (can't combine with DONE filter)
  const totalTickets = await prisma.ticket.count()

  return {
    organizations,
    totalTickets,
    resolvedTickets: resolvedStats._count,
    totalBounties: resolvedStats._sum.bounty || 0,
    lastUpdated: new Date(),
  }
})

