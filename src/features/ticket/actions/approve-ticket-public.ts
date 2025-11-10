"use server"

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect"
import { trackTicketMadePublic } from "@/lib/posthog/events/tickets"
import { prisma } from "@/lib/prisma"
import { captureSentryError } from "@/lib/sentry/capture-error";
import { ticketPath } from "@/paths"


export const approveTicketPublic = async (ticketId: string, organizationId: string) => {
    const {user} = await getAdminOrRedirect(organizationId);
    try {
        // Verify user is admin of the organization
      
        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: "Approving ticket public",
            level: "info",
            data: { ticketId: ticketId, userId: user.id, organizationId: organizationId },
          });
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return toActionState("ERROR", "Ticket not found");
        }

        // Verify ticket belongs to this organization
        if (ticket.organizationId !== organizationId) {
            return toActionState("ERROR", "Ticket does not belong to this organization");
        }

        // Check if there's a pending request
        if (!ticket.publicRequestedAt) {
            return toActionState("ERROR", "No pending public request for this ticket");
        }

        // Check if already public
        if (ticket.isPublic) {
            return toActionState("ERROR", "This ticket is already public");
        }

        // Approve: Make ticket public (IRREVERSIBLE)
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                isPublic: true,
                publishedAt: new Date(),
                publicRequestedAt: null, // Clear request
                publicRequestedBy: null,
            }
        });

        // Track this in posthog

        try {
            await trackTicketMadePublic(user.id, organizationId, {
                ticketId: ticketId,
                approvedByUserId: user.id,
                requestedByUserId: ticket.publicRequestedBy ?? undefined,
                hasBounty: ticket.bounty > 0,
               status: ticket.status as string,
            });
        } catch (posthogError) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track ticket event:', posthogError);
            }
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: organizationId,
                ticketId: ticketId,
                action: "track-ticket-made-public",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }



    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,
            ticketId: ticketId,
            action: "approve-ticket-public",
            level: "error",
        });
        return toActionState("ERROR", "Failed to approve public request");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Ticket is now public and visible to everyone");
}

