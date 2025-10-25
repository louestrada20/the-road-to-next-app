import { DeprovisioningReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RemovalCandidate } from "../types";

/**
 * Creates deprovisioning queue entries for the given candidates
 * Default grace period: 14 days
 * 
 * @param organizationId - Organization ID
 * @param candidates - List of members/invitations to schedule for removal
 * @param reason - Why they're being removed
 * @param gracePeriodDays - Days until execution (default: 14)
 * @returns Array of created queue entry IDs
 */
export async function createQueueEntries(
  organizationId: string,
  candidates: RemovalCandidate[],
  reason: DeprovisioningReason,
  gracePeriodDays: number = 14
): Promise<string[]> {
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + gracePeriodDays);

  const createdIds: string[] = [];

  // Only create queue entries for memberships, not invitations
  // Invitations will be deleted immediately in a separate flow
  const membershipCandidates = candidates.filter((c) => c.type === "membership");

  for (const candidate of membershipCandidates) {
    if (!candidate.userId) continue;

    try {
      // Use upsert to handle race conditions (if entry already exists, update it)
      const entry = await prisma.deprovisioningQueue.upsert({
        where: {
          organizationId_userId: {
            organizationId,
            userId: candidate.userId,
          },
        },
        create: {
          organizationId,
          userId: candidate.userId,
          scheduledFor,
          originalScheduledFor: scheduledFor,
          reason,
          status: "PENDING",
        },
        update: {
          // If entry exists but was canceled, reactivate it
          scheduledFor,
          originalScheduledFor: scheduledFor,
          reason,
          status: "PENDING",
          extensionGranted: false,
          extensionReason: null,
          extendedBy: null,
          notificationsSent: 0,
          lastNotificationAt: null,
        },
      });

      createdIds.push(entry.id);
    } catch (error) {
      console.error(
        `Failed to create deprovisioning queue entry for user ${candidate.userId}:`,
        error
      );
      // Continue with other candidates even if one fails
    }
  }

  return createdIds;
}

/**
 * Immediately deletes invitations (no queue needed for pending invites)
 * 
 * @param organizationId - Organization ID
 * @param candidates - List of invitation candidates to remove
 * @returns Number of invitations deleted
 */
export async function deleteInvitationsImmediately(
  organizationId: string,
  candidates: RemovalCandidate[]
): Promise<number> {
  const invitationEmails = candidates
    .filter((c) => c.type === "invitation" && c.email)
    .map((c) => c.email!);

  if (invitationEmails.length === 0) return 0;

  const result = await prisma.invitation.deleteMany({
    where: {
      organizationId,
      email: { in: invitationEmails },
    },
  });

  console.log(
    `Deleted ${result.count} pending invitations for organization ${organizationId}`
  );

  return result.count;
}