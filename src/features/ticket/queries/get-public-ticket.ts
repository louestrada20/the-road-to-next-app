import { prisma } from "@/lib/prisma"
import { fromCent } from "@/utils/currency"

export const getPublicTicket = async (ticketId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
      isPublic: true, // Only return if public
    },
    select: {
      id: true,
      title: true,
      content: true,
      bounty: true,
      deadline: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      organization: {
        select: {
          id: true,
          name: true,
        }
      },
      user: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
        }
      },
      solvedBy: {
        select: {
          username: true,
        }
      },
      solvedAt: true,
      // Exclude internal fields
      // - comments (show separately with filtering)
      // - attachments (show separately with filtering)
      // - bountyApproved
      // - bountyPaidAt
    }
  })

  if (!ticket) {
    return null
  }

  return {
    ...ticket,
    bountyFormatted: fromCent(ticket.bounty)
  }
}

