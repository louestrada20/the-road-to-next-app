"use server"

import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect"
import { prisma } from "@/lib/prisma"
import { ticketPath } from "@/paths"
import * as Sentry from "@sentry/nextjs";
import { captureSentryError } from "@/lib/sentry/capture-error";
import { trackTicketMadePublic, trackTicketPublicDenied } from "@/lib/posthog/events/tickets"

export const denyTicketPublic = async (ticketId: string, organizationId: string) => {
   
    const {user} = await getAdminOrRedirect(organizationId);
    try {
        // Verify user is admin of the organization
      

        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: "Denying ticket public",
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

            // Deny: Clear the request
            await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    publicRequestedAt: null,
                    publicRequestedBy: null,
                }
            });
        // Track this in posthog
        try {
            await trackTicketPublicDenied(user.id, organizationId, {
                ticketId: ticketId,
                deniedByUserId: user.id,
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
                action: "track-ticket-public-denied",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }

    

    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,
            ticketId: ticketId,
            action: "deny-ticket-public",
            level: "error",
        });
        return toActionState("ERROR", "Failed to deny public request");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Public request denied");
}

