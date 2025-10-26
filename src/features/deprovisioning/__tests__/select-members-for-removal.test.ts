import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { asMockObject } from '@/test/types/mocks';
import { selectMembersForRemoval } from '../service/select-members-for-removal';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    invitation: { findMany: vi.fn() },
    membership: { findMany: vi.fn() },
    organization: { findUnique: vi.fn() },
  },
}));

describe('selectMembersForRemoval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty list when under limit', async () => {
    asMockObject(prisma.invitation).findMany.mockResolvedValue([]);
    asMockObject(prisma.membership).findMany.mockResolvedValue([
      { userId: 'user1', membershipRole: 'ADMIN', joinedAt: new Date(), organizationId: 'org1', isActive: true, canDeleteTicket: true, canUpdateTicket: true, canResolveTickets: true },
      { userId: 'user2', membershipRole: 'MEMBER', joinedAt: new Date(), organizationId: 'org1', isActive: true, canDeleteTicket: false, canUpdateTicket: false, canResolveTickets: true },
    ]);
    asMockObject(prisma.organization).findUnique.mockResolvedValue({ creatorUserId: 'user1', name: 'Test Org', id: 'org1', createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null });

    const result = await selectMembersForRemoval({
      organizationId: 'org1',
      newAllowedMembers: 5, // Higher than current
    });

    expect(result.toRemove).toHaveLength(0);
    expect(result.requiresManualIntervention).toBe(false);
  });

  it('should prioritize invitations over members', async () => {
    asMockObject(prisma.invitation).findMany.mockResolvedValue([
      { email: 'invite1@example.com', createdAt: new Date(), updatedAt: new Date(), organizationId: 'org1', status: 'PENDING', tokenHash: 'hash1', invitedByUserId: null },
      { email: 'invite2@example.com', createdAt: new Date(), updatedAt: new Date(), organizationId: 'org1', status: 'PENDING', tokenHash: 'hash2', invitedByUserId: null },
    ]);
    asMockObject(prisma.membership).findMany.mockResolvedValue([
      { userId: 'user1', membershipRole: 'MEMBER', joinedAt: new Date('2024-01-01'), organizationId: 'org1', isActive: true, canDeleteTicket: false, canUpdateTicket: false, canResolveTickets: true },
    ]);
    asMockObject(prisma.organization).findUnique.mockResolvedValue({ creatorUserId: null, name: 'Test Org', id: 'org1', createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null });

    const result = await selectMembersForRemoval({
      organizationId: 'org1',
      newAllowedMembers: 2, // Need to remove 1
    });

    expect(result.toRemove).toHaveLength(1);
    expect(result.toRemove[0].type).toBe('invitation');
  });

  it('should protect original creator admin', async () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-06-01');

    asMockObject(prisma.invitation).findMany.mockResolvedValue([]);
    asMockObject(prisma.membership).findMany.mockResolvedValue([
      { userId: 'creator', membershipRole: 'ADMIN', joinedAt: oldDate, organizationId: 'org1', isActive: true, canDeleteTicket: true, canUpdateTicket: true, canResolveTickets: true },
      { userId: 'new-admin', membershipRole: 'ADMIN', joinedAt: newDate, organizationId: 'org1', isActive: true, canDeleteTicket: true, canUpdateTicket: true, canResolveTickets: true },
    ]);
    asMockObject(prisma.organization).findUnique.mockResolvedValue({ creatorUserId: 'creator', name: 'Test Org', id: 'org1', createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null });

    const result = await selectMembersForRemoval({
      organizationId: 'org1',
      newAllowedMembers: 1, // Need to remove 1
    });

    expect(result.toRemove).toHaveLength(1);
    expect(result.toRemove[0].userId).toBe('new-admin'); // Creator protected
  });

  it('should require manual intervention when only protected admins remain', async () => {
    asMockObject(prisma.invitation).findMany.mockResolvedValue([]);
    asMockObject(prisma.membership).findMany.mockResolvedValue([
      { userId: 'creator', membershipRole: 'ADMIN', joinedAt: new Date(), organizationId: 'org1', isActive: true, canDeleteTicket: true, canUpdateTicket: true, canResolveTickets: true },
    ]);
    asMockObject(prisma.organization).findUnique.mockResolvedValue({ creatorUserId: 'creator', name: 'Test Org', id: 'org1', createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null });

    const result = await selectMembersForRemoval({
      organizationId: 'org1',
      newAllowedMembers: 0, // Impossible scenario
    });

    expect(result.toRemove).toHaveLength(0);
    expect(result.requiresManualIntervention).toBe(true);
    expect(result.interventionReason).toContain('minimum admin requirement');
  });

  it('should remove newest members first', async () => {
    const dates = {
      oldest: new Date('2024-01-01'),
      middle: new Date('2024-03-01'),
      newest: new Date('2024-06-01'),
    };

    asMockObject(prisma.invitation).findMany.mockResolvedValue([]);
    asMockObject(prisma.membership).findMany.mockResolvedValue([
      { userId: 'admin', membershipRole: 'ADMIN', joinedAt: dates.oldest, organizationId: 'org1', isActive: true, canDeleteTicket: true, canUpdateTicket: true, canResolveTickets: true },
      { userId: 'old-member', membershipRole: 'MEMBER', joinedAt: dates.oldest, organizationId: 'org1', isActive: true, canDeleteTicket: false, canUpdateTicket: false, canResolveTickets: true },
      { userId: 'middle-member', membershipRole: 'MEMBER', joinedAt: dates.middle, organizationId: 'org1', isActive: true, canDeleteTicket: false, canUpdateTicket: false, canResolveTickets: true },
      { userId: 'new-member', membershipRole: 'MEMBER', joinedAt: dates.newest, organizationId: 'org1', isActive: true, canDeleteTicket: false, canUpdateTicket: false, canResolveTickets: true },
    ]);
    asMockObject(prisma.organization).findUnique.mockResolvedValue({ creatorUserId: 'admin', name: 'Test Org', id: 'org1', createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null });

    const result = await selectMembersForRemoval({
      organizationId: 'org1',
      newAllowedMembers: 2, // Need to remove 2 members
    });

    expect(result.toRemove).toHaveLength(2);
    expect(result.toRemove[0].userId).toBe('new-member'); // Newest removed first
    expect(result.toRemove[1].userId).toBe('middle-member');
  });
});