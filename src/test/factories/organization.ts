import { Membership,Organization } from '@prisma/client'

let orgIdCounter = 1

export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => {
  const id = `org-${orgIdCounter++}`
  
  return {
    id,
    name: `Organization ${orgIdCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: `cus_test_${orgIdCounter}`,
    ...overrides,
  }
}

export const createMockMembership = (
  userId: string,
  organizationId: string,
  overrides: Partial<Membership> = {}
): Membership => {
  return {
    userId,
    organizationId,
    joinedAt: new Date(),
    isActive: true,
    membershipRole: 'MEMBER',
    canDeleteTicket: true,
    canUpdateTicket: true,
    ...overrides,
  }
}

export const createAdminMembership = (
  userId: string,
  organizationId: string,
  overrides: Partial<Membership> = {}
): Membership => {
  return createMockMembership(userId, organizationId, {
    membershipRole: 'ADMIN',
    ...overrides,
  })
}
