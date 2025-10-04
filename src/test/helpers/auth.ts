import { Organization,User } from '@prisma/client'
import { vi } from 'vitest'
import { createMockOrganization,createMockUser } from '../factories'

export interface MockActiveOrganization extends Organization {
  membershipByUser: {
    organizationId: string
    userId: string
    joinedAt: Date
    isActive: boolean
    membershipRole: 'MEMBER' | 'ADMIN'
    canDeleteTicket: boolean
    canUpdateTicket: boolean
  }
  _count: {
    memberships: number
  }
}

export interface MockAuthContext {
  user: User
  activeOrganization: MockActiveOrganization | undefined
  session: {
    id: string
    userId: string
    expiresAt: Date
    refreshedAt: Date | null
  }
  fresh: boolean
}

export const createMockActiveOrganization = (userId: string, org?: Partial<Organization>): MockActiveOrganization => {
  const baseOrg = createMockOrganization(org)
  return {
    ...baseOrg,
    membershipByUser: {
      organizationId: baseOrg.id,
      userId: userId,
      joinedAt: new Date(),
      isActive: true,
      membershipRole: 'MEMBER',
      canDeleteTicket: true,
      canUpdateTicket: true,
    },
    _count: {
      memberships: 1
    }
  }
}

export const mockAuthContext = (overrides: Partial<MockAuthContext> = {}): MockAuthContext => {
  const user = overrides.user || createMockUser()
  const activeOrganization = overrides.activeOrganization !== undefined 
    ? overrides.activeOrganization 
    : createMockActiveOrganization(user.id)
  
  return {
    user,
    activeOrganization,
    session: overrides.session || {
      id: 'session-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      refreshedAt: null,
    },
    fresh: overrides.fresh !== undefined ? overrides.fresh : true,
  }
}

export const mockGetAuthOrRedirect = (context: MockAuthContext) => {
  return vi.fn().mockResolvedValue(context)
}

export const mockGetAuth = (context: Partial<MockAuthContext> | null = null) => {
  if (context === null) {
    return vi.fn().mockResolvedValue({ 
      user: null, 
      activeOrganization: null,
      session: null,
      fresh: false
    })
  }
  
  const fullContext = mockAuthContext(context)
  return vi.fn().mockResolvedValue(fullContext)
}

export const mockIsOwner = (result: boolean = true) => {
  return vi.fn().mockReturnValue(result)
}
