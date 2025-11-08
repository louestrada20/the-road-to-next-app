import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect'
import { getOrganizationsByUser } from '@/features/organization/queries/get-organizations-by-user'
import { prisma } from '@/lib/prisma'
import { organizationPath } from '@/paths'
import { createMockUser } from '@/test/factories'
import { mockAuthContext } from '@/test/helpers'
import { asMock, asMockObject } from '@/test/types/mocks'
import { switchOrganization } from '../switch-organization'

// Mock dependencies
vi.mock('@/features/auth/queries/get-auth-or-redirect')
vi.mock('@/features/organization/queries/get-organizations-by-user')
vi.mock('@/lib/posthog/events/organization')

describe('switchOrganization', () => {
  const mockUser = createMockUser()
  const authContext = mockAuthContext({ user: mockUser })

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import and mock trackOrganizationSwitched dynamically
    const { trackOrganizationSwitched } = await import('@/lib/posthog/events/organization')
    asMock(trackOrganizationSwitched).mockResolvedValue(undefined)
    
    // Default successful mocks
    asMock(getAuthOrRedirect).mockResolvedValue(authContext)
    asMock(getOrganizationsByUser).mockResolvedValue([
      {
        id: 'org-1',
        name: 'Organization 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
        creatorUserId: mockUser.id,
        membershipByUser: {
          userId: mockUser.id,
          organizationId: 'org-1',
          isActive: true,
          membershipRole: 'ADMIN' as const,
          joinedAt: new Date(),
          canUpdateTicket: true,
          canDeleteTicket: true,
          canResolveTickets: true,
        },
        _count: { memberships: 1 },
      },
      {
        id: 'org-2',
        name: 'Organization 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
        creatorUserId: mockUser.id,
        membershipByUser: {
          userId: mockUser.id,
          organizationId: 'org-2',
          isActive: false,
          membershipRole: 'MEMBER' as const,
          joinedAt: new Date(),
          canUpdateTicket: false,
          canDeleteTicket: false,
          canResolveTickets: false,
        },
        _count: { memberships: 2 },
      },
    ])
    
    asMockObject(prisma).$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        return await callback(prisma)
      }
      return callback
    })
    asMockObject(prisma.membership).updateMany.mockResolvedValue({ count: 1 })
    asMockObject(prisma.membership).update.mockResolvedValue({
      userId: mockUser.id,
      organizationId: 'org-2',
      isActive: true,
      membershipRole: 'MEMBER',
      joinedAt: new Date(),
      canUpdateTicket: false,
      canDeleteTicket: false,
      canResolveTickets: false,
    })
  })

  describe('Security - Authentication', () => {
    it('should call getAuthOrRedirect with checkActiveOrganization: false', async () => {
      await switchOrganization('org-2')

      expect(getAuthOrRedirect).toHaveBeenCalledTimes(1)
      expect(getAuthOrRedirect).toHaveBeenCalledWith({
        checkActiveOrganization: false,
      })
    })

    it('should call getAuthOrRedirect before any database operations', async () => {
      const callOrder: string[] = []

      asMock(getAuthOrRedirect).mockImplementation(async () => {
        callOrder.push('auth')
        return authContext
      })

      asMockObject(prisma).$transaction.mockImplementation(async (callback: any) => {
        callOrder.push('db')
        if (typeof callback === 'function') {
          return await callback(prisma)
        }
        return callback
      })

      await switchOrganization('org-2')

      // Auth must be called before database
      expect(callOrder[0]).toBe('auth')
      expect(callOrder[1]).toBe('db')
    })
  })

  describe('Security - Authorization', () => {
    it('should verify user is member of target organization', async () => {
      await switchOrganization('org-2')

      expect(getOrganizationsByUser).toHaveBeenCalledTimes(1)
    })

    it('should reject switching to organization user is not member of', async () => {
      const result = await switchOrganization('org-999-not-member')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Not a member of this organization')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should allow switching to organization user is member of', async () => {
      const result = await switchOrganization('org-2')

      expect(result.status).toBe('SUCCESS')
      expect(result.message).toBe('Active organization has been switched')
    })
  })

  describe('Database Operations', () => {
    it('should deactivate all other memberships for user', async () => {
      await switchOrganization('org-2')

      expect(prisma.membership.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          organizationId: {
            not: 'org-2',
          },
        },
        data: {
          isActive: false,
        },
      })
    })

    it('should activate target organization membership', async () => {
      await switchOrganization('org-2')

      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: {
          membershipId: {
            organizationId: 'org-2',
            userId: mockUser.id,
          },
        },
        data: {
          isActive: true,
        },
      })
    })

    it('should execute both operations in a transaction', async () => {
      await switchOrganization('org-2')

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array))
    })

    it('should not execute database operations if authorization fails', async () => {
      await switchOrganization('org-999-not-member')

      expect(prisma.$transaction).not.toHaveBeenCalled()
      expect(prisma.membership.updateMany).not.toHaveBeenCalled()
      expect(prisma.membership.update).not.toHaveBeenCalled()
    })
  })

  describe('Path Revalidation', () => {
    it('should revalidate organization path after successful switch', async () => {
      await switchOrganization('org-2')

      expect(revalidatePath).toHaveBeenCalledWith(organizationPath())
    })

    it('should not revalidate path if switch fails', async () => {
      await switchOrganization('org-999-not-member')

      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('Analytics Tracking', () => {
    it('should track organization switch in PostHog', async () => {
      const { trackOrganizationSwitched } = await import('@/lib/posthog/events/organization')
      
      await switchOrganization('org-2')

      expect(trackOrganizationSwitched).toHaveBeenCalledWith(mockUser.id, 'org-2')
    })

    it('should not fail if PostHog tracking fails', async () => {
      const { trackOrganizationSwitched } = await import('@/lib/posthog/events/organization')
      asMock(trackOrganizationSwitched).mockRejectedValue(new Error('PostHog error'))

      const result = await switchOrganization('org-2')

      // Should still succeed
      expect(result.status).toBe('SUCCESS')
    })

    it('should not track if switch fails authorization', async () => {
      const { trackOrganizationSwitched } = await import('@/lib/posthog/events/organization')
      
      await switchOrganization('org-999-not-member')

      expect(trackOrganizationSwitched).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed')
      asMockObject(prisma).$transaction.mockRejectedValue(error)

      const result = await switchOrganization('org-2')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Database connection failed')
    })

    it('should return error if getOrganizationsByUser fails', async () => {
      const error = new Error('Failed to fetch organizations')
      asMock(getOrganizationsByUser).mockRejectedValue(error)

      const result = await switchOrganization('org-2')

      expect(result.status).toBe('ERROR')
      expect(result.message).toBe('Failed to fetch organizations')
    })
  })

  describe('Security Regression - Auth NOT Compromised', () => {
    it('should ALWAYS check authentication even for repeated calls', async () => {
      // Call multiple times
      await switchOrganization('org-2')
      await switchOrganization('org-1')
      await switchOrganization('org-2')

      // Auth must be checked every single time
      expect(getAuthOrRedirect).toHaveBeenCalledTimes(3)
    })

    it('should ALWAYS check authorization for each call', async () => {
      await switchOrganization('org-2')
      await switchOrganization('org-1')

      // Authorization must be checked every time
      expect(getOrganizationsByUser).toHaveBeenCalledTimes(2)
    })

    it('should not cache or skip auth checks', async () => {
      vi.clearAllMocks()

      // First call
      await switchOrganization('org-2')
      const firstAuthCallCount = asMock(getAuthOrRedirect).mock.calls.length

      // Second call - auth must be called again
      await switchOrganization('org-1')
      const secondAuthCallCount = asMock(getAuthOrRedirect).mock.calls.length

      expect(secondAuthCallCount).toBe(firstAuthCallCount + 1)
    })
  })
})

