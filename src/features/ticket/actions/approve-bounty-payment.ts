"use server"

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"
import { isOwner } from "@/features/auth/utils/is-owner"
import { trackTicketBountyApproved } from "@/lib/posthog/events/tickets"
import { prisma } from "@/lib/prisma"
import { captureSentryError } from "@/lib/sentry/capture-error";
import { ticketPath } from "@/paths"

export const approveBountyPayment = async (ticketId: string) => {
    const { user } = await getAuthOrRedirect();
    let organizationId: string | undefined;
    try {
        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: "Approving bounty payment",
            level: "info",
            data: { ticketId: ticketId, userId: user.id },
          });
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }, 
            select: { organizationId: true, solvedByUserId: true, status: true, bountyApproved: true, bountyPaidAt: true, userId: true, createdAt: true, bounty: true }
        });

        if (!ticket) {
            return toActionState("ERROR", "Ticket not found");
        }
        organizationId = ticket.organizationId;
        // Only ticket creator can approve bounty
        if (!isOwner(user, ticket)) {
            return toActionState("ERROR", "Only ticket creator can approve bounty");
        }

        // Must have solver and be marked DONE
        if (!ticket.solvedByUserId || ticket.status !== 'DONE') {
            return toActionState("ERROR", "Ticket must be solved before approving bounty");
        }

        // Prevent duplicate approval
        if (ticket.bountyApproved || ticket.bountyPaidAt) {
            return toActionState("ERROR", "Bounty already approved");
        }

      
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                bountyApproved: true,
                bountyPaidAt: new Date(),
            }
        });

             // Calculate days since ticket creation for metrics
             const daysSinceCreated = Math.floor(
                (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
        
          // Track this in posthog
          try {
            await trackTicketBountyApproved(user.id, organizationId, {
                ticketId: ticketId,
                solvedByUserId: ticket.solvedByUserId,
                daysSinceTicketCreated:  daysSinceCreated,
                bountyAmount: ticket.bounty,
                bountyApprovedAt: new Date().toISOString(),
            });
        }
        catch (posthogError) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track ticket event:', posthogError);
            }
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: organizationId,
                ticketId: ticketId,
                action: "track-ticket-bounty-approved",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }

    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId, 
            ticketId: ticketId,
            action: "approve-bounty-payment",
            level: "error",
        });
        return toActionState("ERROR", "Failed to approve bounty");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Bounty approved and marked as paid!");
}

