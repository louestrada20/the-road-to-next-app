import { prisma } from "@/lib/prisma"

export const getPendingMembershipRequests = async (organizationId: string) => {
  const requests = await prisma.invitation.findMany({
    where: {
      organizationId,
      status: 'REQUESTED',
    },
    orderBy: {
      createdAt: 'asc' // Oldest requests first
    },
    include: {
      requestedFromTicket: {
        select: {
          id: true,
          title: true,
          bounty: true,
        }
      }
    }
  })

  return requests
}

