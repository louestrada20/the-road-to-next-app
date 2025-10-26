import { prisma } from "@/lib/prisma"
import { fromCent } from "@/utils/currency"

export async function getBountyLeaderboard(
  organizationId: string,
  limit = 10
) {
  const topSolvers = await prisma.ticket.groupBy({
    by: ['solvedByUserId'],
    where: {
      organizationId,
      solvedByUserId: { not: null },
      bountyPaidAt: { not: null },
      bountyApproved: true,
    },
    _sum: { bounty: true },
    _count: { id: true },
    orderBy: {
      _sum: { bounty: 'desc' }
    },
    take: limit
  });

  // Fetch user details
  const userIds = topSolvers
    .map(s => s.solvedByUserId)
    .filter(Boolean) as string[];
    
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true
    }
  });

  return topSolvers.map(solver => ({
    user: users.find(u => u.id === solver.solvedByUserId),
    totalEarnedCents: solver._sum.bounty || 0,
    totalEarned: fromCent(solver._sum.bounty || 0),
    ticketsSolved: solver._count.id
  }));
}

