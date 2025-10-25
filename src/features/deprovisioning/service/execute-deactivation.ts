import { prisma } from "@/lib/prisma";
import { markCompleted } from "../data/update-queue-entry";

/**
 * Soft deactivate memberships (set isActive = false)
 * Does NOT delete user or membership record
 */
export async function executeDeactivation(queueEntryId: string) {
  const queueEntry = await prisma.deprovisioningQueue.findUnique({
    where: { id: queueEntryId },
  });

  if (!queueEntry) {
    throw new Error(`Queue entry ${queueEntryId} not found`);
  }

  // Verify membership still exists and is active
  const membership = await prisma.membership.findUnique({
    where: {
      membershipId: {
        organizationId: queueEntry.organizationId,
        userId: queueEntry.userId,
      },
    },
  });

  if (!membership) {
    console.log(`Membership already removed for user ${queueEntry.userId}`);
    await markCompleted(queueEntryId);
    return { alreadyRemoved: true };
  }

  if (!membership.isActive) {
    console.log(`Membership already deactivated for user ${queueEntry.userId}`);
    await markCompleted(queueEntryId);
    return { alreadyDeactivated: true };
  }

  // Soft deactivation: Just flip the flag
  await prisma.membership.update({
    where: {
      membershipId: {
        organizationId: queueEntry.organizationId,
        userId: queueEntry.userId,
      },
    },
    data: { isActive: false },
  });

  await markCompleted(queueEntryId);

  console.log(`Deactivated membership for user ${queueEntry.userId} in org ${queueEntry.organizationId}`);
  
  return { success: true, userId: queueEntry.userId };
}

