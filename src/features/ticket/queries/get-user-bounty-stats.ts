import { prisma } from "@/lib/prisma"
import { fromCent } from "@/utils/currency"

export async function getUserBountyStatsForOrg(
  userId: string,
  organizationId: string
) {
  const [paidStats, pendingStats, ticketsSolvedCount] = await Promise.all([
    // Paid bounties
    prisma.ticket.aggregate({
      where: {
        solvedByUserId: userId,
        organizationId,
        bountyPaidAt: { not: null },
        bountyApproved: true,
      },
      _sum: { bounty: true },
      _count: { id: true },
    }),
    // Pending approval
    prisma.ticket.aggregate({
      where: {
        solvedByUserId: userId,
        organizationId,
        status: 'DONE',
        bountyApproved: false,
      },
      _sum: { bounty: true },
      _count: { id: true },
    }),
    // All solved tickets
    prisma.ticket.count({
      where: {
        solvedByUserId: userId,
        organizationId,
      }
    })
  ]);

  return {
    totalEarnedCents: paidStats._sum.bounty || 0,
    totalEarned: fromCent(paidStats._sum.bounty || 0),
    pendingApprovalCents: pendingStats._sum.bounty || 0,
    pendingApproval: fromCent(pendingStats._sum.bounty || 0),
    ticketsPaid: paidStats._count.id,
    ticketsPending: pendingStats._count.id,
    ticketsSolved: ticketsSolvedCount,
  };
}

