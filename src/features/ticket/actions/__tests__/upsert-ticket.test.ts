import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { beforeEach,describe, expect, it, vi } from 'vitest'
import { setCookieByKey } from '@/actions/cookies'
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state'
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect'
import { isOwner } from '@/features/auth/utils/is-owner'
import { prisma } from '@/lib/prisma'
import { ticketPath, ticketsPath } from '@/paths'
import { 
  createMockTicket, 
  createMockUser} from '@/test/factories'
import { createMockActiveOrganization,createTicketFormData, mockAuthContext } from '@/test/helpers'
import { asMock, asMockObject } from '@/test/types/mocks'
import { toCent } from '@/utils/currency'
import { upsertTicket } from '../upsert-ticket'

// Additional mocks not in setup.ts
vi.mock('@/features/auth/queries/get-auth-or-redirect', () => ({
  getAuthOrRedirect: vi.fn()
}))
vi.mock('@/features/auth/utils/is-owner', () => ({
  isOwner: vi.fn()
}))
vi.mock('@/actions/cookies', () => ({
  setCookieByKey: vi.fn()
}))

describe('upsertTicket', () => {
  const mockUser = createMockUser()
  const mockActiveOrg = createMockActiveOrganization(mockUser.id)
  const mockTicket = createMockTicket(mockUser.id, mockActiveOrg.id)
  const authContext = mockAuthContext({ user: mockUser, activeOrganization: mockActiveOrg })

  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful mocks
    asMock(getAuthOrRedirect).mockResolvedValue(authContext)
    asMock(isOwner).mockReturnValue(true)
    asMockObject(prisma.ticket).findUnique.mockResolvedValue(mockTicket)
    asMockObject(prisma.ticket).upsert.mockResolvedValue(mockTicket)
    asMockObject(prisma.membership).findUnique.mockResolvedValue({
      userId: mockUser.id,
      organizationId: mockActiveOrg.id,
      joinedAt: new Date(),
      isActive: true,
      membershipRole: 'MEMBER',
      canDeleteTicket: true,
      canUpdateTicket: true,
    })
  })

  describe('create ticket', () => {
    it('should successfully create a new ticket', async () => {
      const formData = createTicketFormData({
        title: 'New Ticket',
        content: 'New ticket content',
        deadline: '2025-12-31',
        bounty: '150.00'
      })

      const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, formData)

      // Verify auth check
      expect(getAuthOrRedirect).toHaveBeenCalled()

      // Verify ticket creation
      expect(prisma.ticket.upsert).toHaveBeenCalledWith({
        where: { id: '' },
        update: expect.objectContaining({
          title: 'New Ticket',
          content: 'New ticket content',
          deadline: '2025-12-31',
          bounty: toCent(150), // Should be converted to cents
          userId: mockUser.id,
        }),
        create: expect.objectContaining({
          title: 'New Ticket',
          content: 'New ticket content',
          deadline: '2025-12-31',
          bounty: toCent(150),
          userId: mockUser.id,
          organizationId: mockActiveOrg.id,
        })
      })

      // Verify path revalidation
      expect(revalidatePath).toHaveBeenCalledWith(ticketsPath())

      // Verify success response
      expect(result.status).toBe('SUCCESS')
      expect(result.message).toBe('Ticket created')
    })

    it('should validate required fields', async () => {
      const invalidFormData = createTicketFormData({
        title: '', // Empty title
        content: 'Content',
        deadline: '2025-12-31',
        bounty: '100'
      })

      const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, invalidFormData)

      expect(result.status).toBe('ERROR')
      expect(result.fieldErrors?.title).toBeDefined()
      expect(prisma.ticket.upsert).not.toHaveBeenCalled()
    })

    it('should validate deadline format', async () => {
      const invalidFormData = createTicketFormData({
        deadline: 'invalid-date'
      })

      const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, invalidFormData)

      expect(result.status).toBe('ERROR')
      expect(result.fieldErrors?.deadline).toBeDefined()
      expect(prisma.ticket.upsert).not.toHaveBeenCalled()
    })

    it('should validate bounty is positive', async () => {
      const invalidFormData = createTicketFormData({
        bounty: '-50'
      })

      const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, invalidFormData)

      expect(result.status).toBe('ERROR')
      expect(result.fieldErrors?.bounty).toBeDefined()
      expect(prisma.ticket.upsert).not.toHaveBeenCalled()
    })
  })

  describe('update ticket', () => {
    const ticketId = 'ticket-123'

    it('should successfully update an existing ticket', async () => {
      const formData = createTicketFormData({
        title: 'Updated Ticket',
        content: 'Updated content',
        deadline: '2025-12-31',
        bounty: '200.00'
      })

      // Redirect throws an error in Next.js, so we expect this to throw
      await expect(
        upsertTicket(ticketId, EMPTY_ACTION_STATE, formData)
      ).rejects.toThrow()

      // Verify ticket lookup
      expect(prisma.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId }
      })

      // Verify ownership check
      expect(isOwner).toHaveBeenCalledWith(mockUser, mockTicket)

      // Verify ticket update
      expect(prisma.ticket.upsert).toHaveBeenCalledWith({
        where: { id: ticketId },
        update: expect.objectContaining({
          title: 'Updated Ticket',
          content: 'Updated content',
          deadline: '2025-12-31',
          bounty: toCent(200),
          userId: mockUser.id,
        }),
        create: expect.any(Object)
      })

      // Verify cookie and redirect
      expect(setCookieByKey).toHaveBeenCalledWith('toast', 'Ticket Updated')
      expect(redirect).toHaveBeenCalledWith(ticketPath(ticketId))
    })

    it('should return error when ticket not found', async () => {
      asMockObject(prisma.ticket).findUnique.mockResolvedValue(null)

      const formData = createTicketFormData()
      const result = await upsertTicket(ticketId, EMPTY_ACTION_STATE, formData)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Not authorized')
      expect(prisma.ticket.upsert).not.toHaveBeenCalled()
    })

    it('should return error when user is not owner', async () => {
      asMock(isOwner).mockReturnValue(false)

      const formData = createTicketFormData()
      const result = await upsertTicket(ticketId, EMPTY_ACTION_STATE, formData)

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Not authorized')
      expect(prisma.ticket.upsert).not.toHaveBeenCalled()
    })
  })

  it('should handle database errors gracefully', async () => {
    const error = new Error('Database connection failed')
    asMockObject(prisma.ticket).upsert.mockRejectedValue(error)

    const formData = createTicketFormData()
    const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, formData)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Database connection failed')
    expect(result.payload).toEqual(formData)
  })

  it('should require active organization for new tickets', async () => {
    asMock(getAuthOrRedirect).mockResolvedValue({
      user: mockUser,
      activeOrganization: undefined, // No active organization
      session: authContext.session,
      fresh: authContext.fresh
    })

    const formData = createTicketFormData()
    
    // This will return an error state when trying to access activeOrganization!.id
    const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, formData)
    
    expect(result.status).toBe('ERROR')
    expect(result.message).toContain("Cannot read properties of")
  })
})
