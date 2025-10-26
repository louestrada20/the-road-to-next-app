import { describe, it, expect, vi, beforeEach } from 'vitest'
import { approveBountyPayment } from '../approve-bounty-payment'
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect'
import { prisma } from '@/lib/prisma'
import { createMockUser, createMockTicket } from '@/test/factories'
import { createMockActiveOrganization, mockAuthContext } from '@/test/helpers'
import { asMock, asMockObject } from '@/test/types/mocks'

vi.mock('@/features/auth/queries/get-auth-or-redirect')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('approveBountyPayment', () => {
  const mockUser = createMockUser()
  const mockActiveOrg = createMockActiveOrganization(mockUser.id)
  const mockTicket = createMockTicket(mockUser.id, mockActiveOrg.id)
  const authContext = mockAuthContext({ user: mockUser, activeOrganization: mockActiveOrg })

  const otherUserId = 'other-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
    asMock(getAuthOrRedirect).mockResolvedValue(authContext)
  })

  describe('successful approval', () => {
    it('should allow ticket creator to approve bounty payment', async () => {
      const solvedTicket = {
        ...mockTicket,
        status: 'DONE' as const,
        solvedByUserId: otherUserId,
        solvedAt: new Date(),
        bountyApproved: false,
        bountyPaidAt: null,
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(solvedTicket)

      const result = await approveBountyPayment(solvedTicket.id)

      expect(result.status).toBe('SUCCESS')
      expect(result.message).toBe('Bounty approved and marked as paid!')
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: solvedTicket.id },
        data: {
          bountyApproved: true,
          bountyPaidAt: expect.any(Date),
        },
      })
    })
  })

  describe('validation errors', () => {
    it('should reject if ticket not found', async () => {
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(null)

      const result = await approveBountyPayment('nonexistent-id')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Ticket not found')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if user is not ticket creator', async () => {
      const ticketByOtherUser = {
        ...createMockTicket(otherUserId, mockActiveOrg.id),
        status: 'DONE' as const,
        solvedByUserId: 'third-user-id',
        solvedAt: new Date(),
        bountyApproved: false,
        bountyPaidAt: null,
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketByOtherUser)

      const result = await approveBountyPayment(ticketByOtherUser.id)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Only ticket creator can approve bounty')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if ticket has no solver', async () => {
      const unsolvedTicket = {
        ...mockTicket,
        status: 'OPEN' as const,
        solvedByUserId: null,
        solvedAt: null,
        bountyApproved: false,
        bountyPaidAt: null,
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(unsolvedTicket)

      const result = await approveBountyPayment(unsolvedTicket.id)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Ticket must be solved before approving bounty')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if ticket status is not DONE', async () => {
      const inProgressTicket = {
        ...mockTicket,
        status: 'IN_PROGRESS' as const,
        solvedByUserId: otherUserId,
        solvedAt: new Date(),
        bountyApproved: false,
        bountyPaidAt: null,
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(inProgressTicket)

      const result = await approveBountyPayment(inProgressTicket.id)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Ticket must be solved before approving bounty')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if bounty already approved', async () => {
      const approvedTicket = {
        ...mockTicket,
        status: 'DONE' as const,
        solvedByUserId: otherUserId,
        solvedAt: new Date(),
        bountyApproved: true,
        bountyPaidAt: new Date(),
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(approvedTicket)

      const result = await approveBountyPayment(approvedTicket.id)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Bounty already approved')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if bountyPaidAt is already set', async () => {
      const paidTicket = {
        ...mockTicket,
        status: 'DONE' as const,
        solvedByUserId: otherUserId,
        solvedAt: new Date(),
        bountyApproved: false,
        bountyPaidAt: new Date(),
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(paidTicket)

      const result = await approveBountyPayment(paidTicket.id)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Bounty already approved')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const solvedTicket = {
        ...mockTicket,
        status: 'DONE' as const,
        solvedByUserId: otherUserId,
        solvedAt: new Date(),
        bountyApproved: false,
        bountyPaidAt: null,
      }

      asMockObject(prisma.ticket).findUnique.mockResolvedValue(solvedTicket)
      asMockObject(prisma.ticket).update.mockRejectedValue(new Error('Database connection failed'))

      const result = await approveBountyPayment(solvedTicket.id)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Failed to approve bounty')
    })
  })
})

