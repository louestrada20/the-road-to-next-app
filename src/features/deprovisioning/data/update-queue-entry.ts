import { DeprovisioningStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Update queue entry status after sending notification
 */
export async function markNotificationSent(
  queueId: string,
  newStatus: DeprovisioningStatus
) {
  return await prisma.deprovisioningQueue.update({
    where: { id: queueId },
    data: {
      status: newStatus,
      notificationsSent: { increment: 1 },
      lastNotificationAt: new Date(),
    },
  });
}

/**
 * Mark deprovisioning as completed
 */
export async function markCompleted(queueId: string) {
  return await prisma.deprovisioningQueue.update({
    where: { id: queueId },
    data: {
      status: "COMPLETED",
    },
  });
}

/**
 * Cancel a deprovisioning entry
 */
export async function cancelDeprovisioning(
  queueId: string,
  reason: "CANCELED_UPGRADE" | "CANCELED_MANUAL" | "CANCELED_USER_LEFT"
) {
  return await prisma.deprovisioningQueue.update({
    where: { id: queueId },
    data: {
      status: reason,
    },
  });
}

/**
 * Grant extension to a deprovisioning entry
 * Extends by specified days (default: 14 more days)
 */
export async function grantExtension(
  queueId: string,
  extensionDays: number = 14,
  extendedBy: string,
  extensionReason: string
) {
  const entry = await prisma.deprovisioningQueue.findUnique({
    where: { id: queueId },
  });

  if (!entry) {
    throw new Error(`Queue entry ${queueId} not found`);
  }

  if (entry.extensionGranted) {
    throw new Error("Extension already granted for this deprovisioning");
  }

  const newScheduledFor = new Date(entry.scheduledFor);
  newScheduledFor.setDate(newScheduledFor.getDate() + extensionDays);

  return await prisma.deprovisioningQueue.update({
    where: { id: queueId },
    data: {
      scheduledFor: newScheduledFor,
      extensionGranted: true,
      extensionReason,
      extendedBy,
      // Reset notification status to resend with new date
      status: "PENDING",
      notificationsSent: 0,
      lastNotificationAt: null,
    },
  });
}

/**
 * Bulk cancel all pending deprovisionings for an organization
 * Used when organization upgrades
 */
export async function cancelAllForOrganization(
  organizationId: string,
  reason: "CANCELED_UPGRADE" | "CANCELED_MANUAL" = "CANCELED_UPGRADE"
) {
  const result = await prisma.deprovisioningQueue.updateMany({
    where: {
      organizationId,
      status: {
        in: ["PENDING", "NOTIFIED_ONCE", "NOTIFIED_REMINDER", "NOTIFIED_FINAL"],
      },
    },
    data: {
      status: reason,
    },
  });

  console.log(
    `Canceled ${result.count} pending deprovisionings for organization ${organizationId}`
  );

  return result.count;
}