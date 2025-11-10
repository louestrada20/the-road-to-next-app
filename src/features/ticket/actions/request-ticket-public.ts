"use server"

import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"
import { isOwner } from "@/features/auth/utils/is-owner"
import { prisma } from "@/lib/prisma"
import { ticketPath } from "@/paths"
import * as Sentry from "@sentry/nextjs";
import { captureSentryError } from "@/lib/sentry/capture-error";
import { trackTicketPublicRequested } from "@/lib/posthog/events/tickets"

export const requestTicketPublic = async (ticketId: string) => {
    const { user } = await getAuthOrRedirect();
    let organizationId: string | undefined;
    try {
        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: "Requesting ticket public",
            level: "info",
            data: { ticketId: ticketId, userId: user.id },
          });
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { isPublic: true, publicRequestedAt: true, userId: true, organizationId: true }
        });

        if (!ticket) {
            return toActionState("ERROR", "Ticket not found");
        }
        organizationId = ticket.organizationId;   

        // Only ticket creator can request to make public
        if (!isOwner(user, ticket)) {
            return toActionState("ERROR", "Only ticket creator can request to make this ticket public");
        }

        // Check if already public
        if (ticket.isPublic) {
            return toActionState("ERROR", "This ticket is already public");
        }

        // Check if already requested
        if (ticket.publicRequestedAt) {
            return toActionState("ERROR", "Public request is already pending admin approval");
        }

        // Create public request
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                publicRequestedAt: new Date(),
                publicRequestedBy: user.id,
            }
        });

        try {
            await trackTicketPublicRequested(user.id, organizationId, {
                ticketId: ticketId,
                requestedByUserId: user.id,
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
                action: "track-ticket-public-requested",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }

    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId, 
            ticketId: ticketId,
            action: "request-ticket-public",
            level: "error",
        });
        return toActionState("ERROR", "Failed to request public visibility");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Request sent to admins for approval");
}

