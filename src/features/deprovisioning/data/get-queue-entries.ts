import { DeprovisioningStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Get all pending deprovisionings for an organization
 * Used for UI warnings and admin dashboard
 */
export async function getPendingDeprovisionings(organizationId: string) {
  return await prisma.deprovisioningQueue.findMany({
    where: {
      organizationId,
      status: {
        in: ["PENDING", "NOTIFIED_ONCE", "NOTIFIED_REMINDER", "NOTIFIED_FINAL"],
      },
    },
    orderBy: {
      scheduledFor: "asc", // Soonest first
    },
  });
}

/**
 * Get deprovisionings for a specific user across all organizations
 * Used to show user they're scheduled for removal
 */
export async function getUserDeprovisionings(userId: string) {
  return await prisma.deprovisioningQueue.findMany({
    where: {
      userId,
      status: {
        in: ["PENDING", "NOTIFIED_ONCE", "NOTIFIED_REMINDER", "NOTIFIED_FINAL"],
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      scheduledFor: "asc",
    },
  });
}

/**
 * Get deprovisionings that need notifications sent
 * Used by background jobs to determine who to email
 */
export async function getDeprovisioningsDueForNotification(
  notificationLevel: 1 | 2 | 3 // 1 = Day 0, 2 = Day 7, 3 = Day 13
) {
  const now = new Date();
  
  // Calculate date ranges for each notification level
  let statusFilter: DeprovisioningStatus[] = [];
  let dateFilter: Date;

  switch (notificationLevel) {
    case 1: // Day 0 - just created, not yet notified
      statusFilter = ["PENDING"];
      dateFilter = now; // Send immediately
      break;
    case 2: // Day 7 - first reminder
      statusFilter = ["NOTIFIED_ONCE"];
      dateFilter = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      break;
    case 3: // Day 13 - final warning
      statusFilter = ["NOTIFIED_REMINDER"];
      dateFilter = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day from now
      break;
  }

  return await prisma.deprovisioningQueue.findMany({
    where: {
      status: { in: statusFilter },
      scheduledFor: { lte: dateFilter },
    },
    include: {
      organization: true,
    },
  });
}

/**
 * Get deprovisionings ready for execution
 * Used by background jobs to perform actual deactivation
 */
export async function getDeprovisioningsReadyForExecution() {
  const now = new Date();

  return await prisma.deprovisioningQueue.findMany({
    where: {
      status: "NOTIFIED_FINAL",
      scheduledFor: { lte: now }, // Scheduled time has passed
    },
    include: {
      organization: true,
    },
  });
}

/**
 * Get a specific queue entry
 */
export async function getQueueEntry(id: string) {
  return await prisma.deprovisioningQueue.findUnique({
    where: { id },
    include: {
      organization: true,
    },
  });
}