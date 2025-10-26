import { PAGE_SIZES } from "@/components/pagination/constants"
import { prisma } from "@/lib/prisma"
import { toCurrencyFromCent } from "@/utils/currency"

type GetPublicTicketsParams = {
  page?: number
  size?: number
  search?: string
  organizationId?: string
  minBounty?: number
  maxBounty?: number
  sortBy?: 'bounty' | 'createdAt' | 'deadline'
  sortOrder?: 'asc' | 'desc'
}

export const getPublicTickets = async (params: GetPublicTicketsParams = {}) => {
  const {
    page = 0,
    size = 20,
    search = '',
    organizationId,
    minBounty,
    maxBounty,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params

  // Validate page size
  if (!PAGE_SIZES.includes(size)) {
    throw new Error("Invalid page size")
  }

  // Build where clause
  const where: {
    isPublic: boolean
    status: 'OPEN'
    OR?: Array<{title?: {contains: string; mode: 'insensitive'}; content?: {contains: string; mode: 'insensitive'}}>
    organizationId?: string
    bounty?: {gte?: number; lte?: number}
  } = {
    isPublic: true,
    status: 'OPEN', // Only show open tickets
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' as const } },
      { content: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (organizationId) {
    where.organizationId = organizationId
  }

  if (minBounty !== undefined || maxBounty !== undefined) {
    where.bounty = {}
    if (minBounty !== undefined) {
      where.bounty.gte = minBounty
    }
    if (maxBounty !== undefined) {
      where.bounty.lte = maxBounty
    }
  }

  const skip = page * size
  const take = size

  const [tickets, count] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
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
          }
        }
      }
    }),
    prisma.ticket.count({ where })
  ])

  return {
    list: tickets.map(ticket => ({
      ...ticket,
      bountyFormatted: toCurrencyFromCent(ticket.bounty)
    })),
    metadata: {
      count,
      hasNextPage: count > skip + take,
      page,
      size,
    }
  }
}

