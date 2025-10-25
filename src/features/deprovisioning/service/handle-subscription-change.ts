import { DeprovisioningReason } from "@prisma/client";
import { isDowngrade } from "@/features/stripe/queries/get-product-member-limit";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { createQueueEntries, deleteInvitationsImmediately } from "../data/create-queue-entries";
import { cancelAllForOrganization } from "../data/update-queue-entry";
import { sendEmailRemovalCanceled } from "../emails/send-email-removal-canceled";
import { selectMembersForRemoval } from "./select-members-for-removal";

/**
 * Handles subscription changes and triggers deprovisioning if necessary
 * Called by Stripe webhook when subscription is created/updated/deleted
 * 
 * Flow:
 * 1. Determine if this is a downgrade (fewer members allowed)
 * 2. If yes, select members for removal
 * 3. Create deprovisioning queue entries
 * 4. Immediately delete excess invitations
 * 
 * If this is an upgrade:
 * 1. Cancel any pending deprovisionings
 * 
 * @param organizationId - Organization affected
 * @param oldProductId - Previous product ID (null if first subscription)
 * @param newProductId - New product ID (null if subscription canceled)
 * @param eventAt - Stripe event timestamp for logging
 */
export async function handleSubscriptionChange(
  organizationId: string,
  oldProductId: string | null | undefined,
  newProductId: string | null | undefined,
  eventAt: number
): Promise<void> {
  console.log(`Processing subscription change for org ${organizationId}:`, {
    oldProductId,
    newProductId,
    eventAt,
  });

  // Case 1: Subscription canceled (no product)
  if (!newProductId) {
    console.log(`Subscription canceled for org ${organizationId}. Limiting to 1 member.`);
    await handleDowngrade(organizationId, 1, DeprovisioningReason.SUBSCRIPTION_CANCELLED);
    return;
  }

  // Case 2: New subscription or product changed
  const comparison = await isDowngrade(oldProductId, newProductId);

  if (!comparison) {
    console.log(`No product change or unable to determine limits for org ${organizationId}`);
    return;
  }

  if (comparison.isDowngrade) {
    console.log(`Downgrade detected for org ${organizationId}:`, {
      from: `${comparison.oldLimit} members`,
      to: `${comparison.newLimit} members`,
    });
    await handleDowngrade(organizationId, comparison.newLimit, DeprovisioningReason.SUBSCRIPTION_DOWNGRADE);
  } else {
    console.log(`Upgrade detected for org ${organizationId}:`, {
      from: `${comparison.oldLimit} members`,
      to: `${comparison.newLimit} members`,
    });
    await handleUpgrade(organizationId);
  }
}

/**
 * Handle downgrade scenario: select and schedule members for removal
 */
async function handleDowngrade(
  organizationId: string,
  newLimit: number,
  reason: DeprovisioningReason
): Promise<void> {
  // 1. Select members/invitations to remove
  const selection = await selectMembersForRemoval({
    organizationId,
    newAllowedMembers: newLimit,
  });

  console.log(`Member selection for org ${organizationId}:`, {
    toRemove: selection.toRemove.length,
    requiresManualIntervention: selection.requiresManualIntervention,
    stats: selection.stats,
  });

  // 2. If manual intervention required, log warning
  if (selection.requiresManualIntervention) {
    console.warn(
      `❌ Manual intervention required for org ${organizationId}: ${selection.interventionReason}`
    );
    // TODO: In future, send email to admins about this
  }

  // 3. Immediately delete excess invitations (no grace period needed)
  if (selection.toRemove.some((c) => c.type === "invitation")) {
    const invitationsDeleted = await deleteInvitationsImmediately(organizationId, selection.toRemove);
    console.log(`Deleted ${invitationsDeleted} pending invitations for org ${organizationId}`);
  }

  // 4. Schedule memberships for removal (14-day grace period)
  const membershipCandidates = selection.toRemove.filter((c) => c.type === "membership");
  if (membershipCandidates.length > 0) {
    const queueIds = await createQueueEntries(organizationId, membershipCandidates, reason, 14);
    console.log(
      `Created ${queueIds.length} deprovisioning queue entries for org ${organizationId}`
    );
    
    // Trigger Inngest workflow for notifications and execution
    await inngest.send({
      name: "app/deprovisioning.scheduled",
      data: {
        organizationId,
        queueEntryIds: queueIds,
      },
    });
    
    console.log(`Triggered deprovisioning workflow for org ${organizationId}`);
  }

  console.log(
    `✅ Deprovisioning initiated for org ${organizationId}: ${selection.stats.invitationsToRemove} invitations deleted, ${selection.stats.membershipsToRemove} members scheduled for removal`
  );
}

/**
 * Handle upgrade scenario: cancel any pending deprovisionings
 */
async function handleUpgrade(organizationId: string): Promise<void> {
  const canceledCount = await cancelAllForOrganization(organizationId, "CANCELED_UPGRADE");

  if (canceledCount > 0) {
    console.log(`✅ Canceled ${canceledCount} pending deprovisionings for org ${organizationId}`);
    
    // Send cancellation email to admins
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          where: { membershipRole: "ADMIN", isActive: true },
          include: { user: true },
        },
      },
    });

    if (organization) {
      for (const admin of organization.memberships) {
        try {
          await sendEmailRemovalCanceled(
            admin.user.email,
            admin.user.username,
            organization.name,
            canceledCount
          );
        } catch (error) {
          console.error(`Failed to send cancellation email to ${admin.user.email}:`, error);
        }
      }
      console.log(`Sent cancellation emails to ${organization.memberships.length} admin(s)`);
    }

    // Cancel Inngest workflow
    await inngest.send({
      name: "app/deprovisioning.canceled",
      data: { organizationId },
    });
    
    console.log(`Triggered workflow cancellation for org ${organizationId}`);
  }
}

