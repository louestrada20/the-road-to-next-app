import { Ticket, TicketStatus } from '@prisma/client'
import { toCent } from '@/utils/currency'

let ticketIdCounter = 1

export const createMockTicket = (
  userId: string,
  organizationId: string,
  overrides: Partial<Ticket> = {}
): Ticket => {
  const id = `ticket-${ticketIdCounter++}`
  
  return {
    id,
    title: `Test Ticket ${ticketIdCounter}`,
    content: `This is test ticket content for ticket ${ticketIdCounter}`,
    status: 'OPEN' as TicketStatus,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    bounty: toCent(100), // $100 in cents
    userId,
    organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export const createCompletedTicket = (
  userId: string,
  organizationId: string,
  overrides: Partial<Ticket> = {}
): Ticket => {
  return createMockTicket(userId, organizationId, {
    status: 'DONE' as TicketStatus,
    ...overrides,
  })
}

export const createInProgressTicket = (
  userId: string,
  organizationId: string,
  overrides: Partial<Ticket> = {}
): Ticket => {
  return createMockTicket(userId, organizationId, {
    status: 'IN_PROGRESS' as TicketStatus,
    ...overrides,
  })
}

export const createOverdueTicket = (
  userId: string,
  organizationId: string,
  overrides: Partial<Ticket> = {}
): Ticket => {
  return createMockTicket(userId, organizationId, {
    deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    ...overrides,
  })
}
