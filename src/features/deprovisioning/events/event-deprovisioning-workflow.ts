import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { markNotificationSent } from "../data/update-queue-entry";
import { sendEmailFinalWarning } from "../emails/send-email-final-warning";
import { sendEmailReminder } from "../emails/send-email-reminder";
import { sendEmailRemovalCompleted } from "../emails/send-email-removal-completed";
import { sendEmailScheduledRemoval } from "../emails/send-email-scheduled-removal";
import { executeDeactivation } from "../service/execute-deactivation";

export const deprovisioningWorkflow = inngest.createFunction(
  {
    id: "deprovisioning-workflow",
    cancelOn: [
      {
        event: "app/deprovisioning.canceled",
        match: "data.organizationId",
      },
    ],
  },
  { event: "app/deprovisioning.scheduled" },
  async ({ event, step }) => {
    const { organizationId, queueEntryIds } = event.data;

    // Fetch organization and queue entries
    const { organization, queueEntries, admins, scheduledDate } = await step.run("fetch-data", async () => {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          memberships: {
            where: { membershipRole: "ADMIN", isActive: true },
            include: { user: true },
          },
        },
      });

      if (!org) {
        throw new Error(`Organization ${organizationId} not found`);
      }

      const entries = await prisma.deprovisioningQueue.findMany({
        where: { id: { in: queueEntryIds } },
      });

      if (entries.length === 0) {
        throw new Error(`No queue entries found for organization ${organizationId}`);
      }

      return {
        organization: org,
        queueEntries: entries,
        admins: org.memberships,
        scheduledDate: entries[0].scheduledFor.toISOString(),
      };
    });

    // STEP 1: Day 0 - Immediate notification
    await step.run("send-initial-notification", async () => {
      for (const admin of admins) {
        await sendEmailScheduledRemoval(
          admin.user.email,
          admin.user.username,
          organization.name,
          queueEntries.length,
          scheduledDate,
          queueEntries.map((e) => e.userId)
        );
      }

      // Mark all entries as notified
      for (const entry of queueEntries) {
        await markNotificationSent(entry.id, "NOTIFIED_ONCE");
      }

      console.log(`Sent initial notification to ${admins.length} admin(s) for org ${organizationId}`);
    });

    // STEP 2: Day 7 - Reminder
    await step.sleep("wait-7-days", "7d");

    await step.run("send-reminder", async () => {
      // Re-fetch to check if still pending
      const stillPending = await prisma.deprovisioningQueue.findMany({
        where: {
          id: { in: queueEntryIds },
          status: "NOTIFIED_ONCE",
        },
      });

      if (stillPending.length === 0) {
        console.log("All deprovisionings canceled or completed");
        return;
      }

      for (const admin of admins) {
        await sendEmailReminder(
          admin.user.email,
          admin.user.username,
          organization.name,
          7,
          stillPending.length,
          scheduledDate
        );
      }

      for (const entry of stillPending) {
        await markNotificationSent(entry.id, "NOTIFIED_REMINDER");
      }

      console.log(`Sent 7-day reminder to ${admins.length} admin(s) for org ${organizationId}`);
    });

    // STEP 3: Day 13 - Final warning
    await step.sleep("wait-6-more-days", "6d");

    await step.run("send-final-warning", async () => {
      const stillPending = await prisma.deprovisioningQueue.findMany({
        where: {
          id: { in: queueEntryIds },
          status: "NOTIFIED_REMINDER",
        },
      });

      if (stillPending.length === 0) {
        console.log("All deprovisionings canceled or completed");
        return;
      }

      for (const admin of admins) {
        await sendEmailFinalWarning(
          admin.user.email,
          admin.user.username,
          organization.name,
          24,
          stillPending.length,
          scheduledDate
        );
      }

      for (const entry of stillPending) {
        await markNotificationSent(entry.id, "NOTIFIED_FINAL");
      }

      console.log(`Sent final warning to ${admins.length} admin(s) for org ${organizationId}`);
    });

    // STEP 4: Day 14 - Execute deactivation
    await step.sleep("wait-1-more-day", "1d");

    const executionSummary = await step.run("execute-deactivation", async () => {
      const readyForExecution = await prisma.deprovisioningQueue.findMany({
        where: {
          id: { in: queueEntryIds },
          status: "NOTIFIED_FINAL",
        },
      });

      if (readyForExecution.length === 0) {
        console.log("No members ready for deactivation");
        return { successCount: 0, failureCount: 0, executionResults: [] };
      }

      const executionResults = [];
      let successCount = 0;
      let failureCount = 0;

      for (const entry of readyForExecution) {
        try {
          const result = await executeDeactivation(entry.id);
          executionResults.push(result);
          if ("success" in result && result.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to deactivate membership for queue entry ${entry.id}:`, error);
          failureCount++;
          executionResults.push({ success: false, error: String(error) });
        }
      }

      console.log(`Executed deactivation for ${executionResults.length} member(s) in org ${organizationId}`);
      return { successCount, failureCount, executionResults };
    });

    // STEP 5: Send completion email
    await step.run("send-completion-email", async () => {
      const { successCount } = executionSummary;

      if (successCount === 0) {
        console.log("No successful deactivations to report");
        return;
      }

      // Re-fetch admins for email sending
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          memberships: {
            where: { membershipRole: "ADMIN", isActive: true },
            include: { user: true },
          },
        },
      });

      if (!org) {
        console.log("Organization not found for completion email");
        return;
      }

      for (const admin of org.memberships) {
        await sendEmailRemovalCompleted(
          admin.user.email,
          admin.user.username,
          org.name,
          successCount
        );
      }

      console.log(`Sent completion email to ${org.memberships.length} admin(s) for org ${organizationId}`);
    });

    return { 
      event, 
      summary: {
        organizationId,
        totalScheduled: queueEntryIds.length,
        successfulDeactivations: executionSummary.successCount,
        failedDeactivations: executionSummary.failureCount,
      }
    };
  }
);

