import { prisma } from "@/lib/prisma"
import { fromCent } from "@/utils/currency"

export const getPendingPublicRequests = async (organizationId: string) => {
  const tickets = await prisma.ticket.findMany({
    where: {
      organizationId,
      publicRequestedAt: { not: null },
      isPublic: false, // Not yet approved
    },
    orderBy: {
      publicRequestedAt: 'asc' // Oldest requests first
    },
    select: {
      id: true,
      title: true,
      content: true,
      bounty: true,
      deadline: true,
      status: true,
      createdAt: true,
      publicRequestedAt: true,
      publicRequestedByUser: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
        }
      },
      user: {
        select: {
          username: true,
        }
      }
    }
  })

  return tickets.map(ticket => ({
    ...ticket,
    bountyFormatted: fromCent(ticket.bounty)
  }))
}

