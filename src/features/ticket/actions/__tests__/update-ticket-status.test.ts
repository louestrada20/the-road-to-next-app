import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTicketStatus } from '../update-ticket-status'
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
    membership: {
      findUnique: vi.fn(),
    },
  },
}))

describe('updateTicketStatus', () => {
  const mockUser = createMockUser()
  const mockActiveOrg = createMockActiveOrganization(mockUser.id)
  const mockTicket = createMockTicket(mockUser.id, mockActiveOrg.id)
  const authContext = mockAuthContext({ user: mockUser, activeOrganization: mockActiveOrg })

  const otherUserId = 'other-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
    asMock(getAuthOrRedirect).mockResolvedValue(authContext)
  })

  describe('marking ticket as DONE (solving)', () => {
    it('should allow non-owner with permission to mark ticket as DONE', async () => {
      const ticketByOtherUser = createMockTicket(otherUserId, mockActiveOrg.id)
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketByOtherUser)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: true,
      })

      const result = await updateTicketStatus(ticketByOtherUser.id, 'DONE')

      expect(result.status).toBe('SUCCESS')
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: ticketByOtherUser.id },
        data: {
          status: 'DONE',
          solvedByUserId: mockUser.id,
          solvedAt: expect.any(Date),
          bountyApproved: false,
        },
      })
    })

    it('should prevent self-resolution (owner marking own ticket as DONE)', async () => {
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(mockTicket)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: true,
      })

      const result = await updateTicketStatus(mockTicket.id, 'DONE')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('You cannot solve your own ticket')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if user lacks canResolveTickets permission', async () => {
      const ticketByOtherUser = createMockTicket(otherUserId, mockActiveOrg.id)
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketByOtherUser)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: false, // No permission
      })

      const result = await updateTicketStatus(ticketByOtherUser.id, 'DONE')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('You do not have permission to resolve tickets')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should reject if ticket is not in active organization', async () => {
      const otherOrgId = 'other-org-id'
      const ticketInOtherOrg = createMockTicket(otherUserId, otherOrgId)
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketInOtherOrg)

      const result = await updateTicketStatus(ticketInOtherOrg.id, 'DONE')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe("Switch to this ticket's organization to update status")
      expect(prisma.membership.findUnique).not.toHaveBeenCalled()
    })

    it('should reject if user is not member of organization', async () => {
      const ticketByOtherUser = createMockTicket(otherUserId, mockActiveOrg.id)
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketByOtherUser)
      asMockObject(prisma.membership).findUnique.mockResolvedValue(null)

      const result = await updateTicketStatus(ticketByOtherUser.id, 'DONE')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Not a member of this organization')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })
  })

  describe('reopening or changing from DONE', () => {
    it('should allow owner to reopen solved ticket', async () => {
      const solvedTicket = {
        ...mockTicket,
        status: 'DONE',
        solvedByUserId: otherUserId,
        solvedAt: new Date(),
        bountyApproved: false,
      }
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(solvedTicket)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: true,
      })

      const result = await updateTicketStatus(solvedTicket.id, 'OPEN')

      expect(result.status).toBe('SUCCESS')
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: solvedTicket.id },
        data: {
          status: 'OPEN',
          bountyApproved: false, // Reset approval
        },
      })
    })

    it('should prevent non-owner from reopening ticket', async () => {
      const ticketByOtherUser = createMockTicket(otherUserId, mockActiveOrg.id)
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketByOtherUser)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: true,
      })

      const result = await updateTicketStatus(ticketByOtherUser.id, 'OPEN')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Only ticket creator can change this status')
      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })

    it('should allow owner to change to IN_PROGRESS', async () => {
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(mockTicket)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: true,
      })

      const result = await updateTicketStatus(mockTicket.id, 'IN_PROGRESS')

      expect(result.status).toBe('SUCCESS')
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: mockTicket.id },
        data: { status: 'IN_PROGRESS' },
      })
    })
  })

  describe('error handling', () => {
    it('should return error if ticket not found', async () => {
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(null)

      const result = await updateTicketStatus('nonexistent-id', 'DONE')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Ticket not found')
    })

    it('should handle database errors gracefully', async () => {
      const ticketByOtherUser = createMockTicket(otherUserId, mockActiveOrg.id)
      
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(ticketByOtherUser)
      asMockObject(prisma.membership).findUnique.mockResolvedValue({
        userId: mockUser.id,
        organizationId: mockActiveOrg.id,
        joinedAt: new Date(),
        isActive: true,
        membershipRole: 'MEMBER',
        canDeleteTicket: true,
        canUpdateTicket: true,
        canResolveTickets: true,
      })
      asMockObject(prisma.ticket).update.mockRejectedValue(new Error('Database error'))

      const result = await updateTicketStatus(ticketByOtherUser.id, 'DONE')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Database error')
    })
  })
})

