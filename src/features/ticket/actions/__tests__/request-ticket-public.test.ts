import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect'
import { prisma } from '@/lib/prisma'
import { createMockTicket, createMockUser } from '@/test/factories'
import { createMockActiveOrganization, mockAuthContext } from '@/test/helpers'
import { asMock, asMockObject } from '@/test/types/mocks'
import { requestTicketPublic } from '../request-ticket-public'

vi.mock('@/features/auth/queries/get-auth-or-redirect')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('requestTicketPublic', () => {
  const mockUser = createMockUser()
  const mockActiveOrg = createMockActiveOrganization(mockUser.id)
  const mockTicket = createMockTicket(mockUser.id, mockActiveOrg.id)
  const authContext = mockAuthContext({ user: mockUser, activeOrganization: mockActiveOrg })

  beforeEach(() => {
    vi.clearAllMocks()
    asMock(getAuthOrRedirect).mockResolvedValue(authContext)
  })

  it('should allow ticket owner to request public visibility', async () => {
    asMockObject(prisma.ticket).findUnique.mockResolvedValue(mockTicket)

    const result = await requestTicketPublic(mockTicket.id)

    expect(result.status).toBe('SUCCESS')
    expect(result.message).toBe('Request sent to admins for approval')
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: mockTicket.id },
      data: {
        publicRequestedAt: expect.any(Date),
        publicRequestedBy: mockUser.id,
      }
    })
  })

  it('should reject if user is not ticket owner', async () => {
    const otherUserTicket = createMockTicket('other-user-id', mockActiveOrg.id)
    asMockObject(prisma.ticket).findUnique.mockResolvedValue(otherUserTicket)

    const result = await requestTicketPublic(otherUserTicket.id)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Only ticket creator can request to make this ticket public')
    expect(prisma.ticket.update).not.toHaveBeenCalled()
  })

  it('should reject if ticket is already public', async () => {
    const publicTicket = createMockTicket(mockUser.id, mockActiveOrg.id, {
      isPublic: true,
      publishedAt: new Date()
    })
    asMockObject(prisma.ticket).findUnique.mockResolvedValue(publicTicket)

    const result = await requestTicketPublic(publicTicket.id)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('This ticket is already public')
    expect(prisma.ticket.update).not.toHaveBeenCalled()
  })

  it('should reject if request already pending', async () => {
    const requestedTicket = createMockTicket(mockUser.id, mockActiveOrg.id, {
      publicRequestedAt: new Date()
    })
    asMockObject(prisma.ticket).findUnique.mockResolvedValue(requestedTicket)

    const result = await requestTicketPublic(requestedTicket.id)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Public request is already pending admin approval')
    expect(prisma.ticket.update).not.toHaveBeenCalled()
  })

  it('should reject if ticket not found', async () => {
    asMockObject(prisma.ticket).findUnique.mockResolvedValue(null)

    const result = await requestTicketPublic('nonexistent-id')

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Ticket not found')
    expect(prisma.ticket.update).not.toHaveBeenCalled()
  })
})

