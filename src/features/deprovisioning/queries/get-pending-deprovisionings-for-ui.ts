"use server";

import { prisma } from "@/lib/prisma";

export type PendingDeprovisioningUI = {
  queueEntries: Array<{
    id: string;
    userId: string;
    scheduledFor: Date;
    status: string;
    user: {
      username: string;
      email: string;
    };
    membership: {
      membershipRole: string;
      joinedAt: Date;
    } | null;
  }>;
  count: number;
  scheduledDate: Date;
  daysRemaining: number;
  hoursRemaining: number;
  urgencyLevel: "info" | "warning" | "critical";
};

export async function getPendingDeprovisioningsForUI(
  organizationId: string
): Promise<PendingDeprovisioningUI | null> {
  const queueEntries = await prisma.deprovisioningQueue.findMany({
    where: {
      organizationId,
      status: {
        in: ["PENDING", "NOTIFIED_ONCE", "NOTIFIED_REMINDER", "NOTIFIED_FINAL"],
      },
    },
    orderBy: {
      scheduledFor: "asc", // Earliest first
    },
  });

  if (queueEntries.length === 0) {
    return null;
  }

  // Get user details for each queue entry
  const entriesWithUsers = await Promise.all(
    queueEntries.map(async (entry) => {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: {
          username: true,
          email: true,
        },
      });

      const membership = await prisma.membership.findUnique({
        where: {
          membershipId: {
            organizationId: entry.organizationId,
            userId: entry.userId,
          },
        },
        select: {
          membershipRole: true,
          joinedAt: true,
        },
      });

      return {
        ...entry,
        user: user || { username: "Unknown", email: "unknown@example.com" },
        membership,
      };
    })
  );

  // Use the earliest scheduled date
  const scheduledDate = queueEntries[0].scheduledFor;
  const now = new Date();
  const timeRemaining = scheduledDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

  // Determine urgency level
  let urgencyLevel: "info" | "warning" | "critical";
  if (daysRemaining > 7) {
    urgencyLevel = "info";
  } else if (daysRemaining > 1) {
    urgencyLevel = "warning";
  } else {
    urgencyLevel = "critical";
  }

  return {
    queueEntries: entriesWithUsers,
    count: queueEntries.length,
    scheduledDate,
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining: Math.max(0, hoursRemaining),
    urgencyLevel,
  };
}

