"use server"

import {TicketStatus} from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import {revalidatePath} from "next/cache";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import { trackTicketStatusChanged } from "@/lib/posthog/events/tickets";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {ticketsPath} from "@/paths";

export const updateTicketStatus = async (id: string, status: TicketStatus) => {

    const {user, activeOrganization} = await getAuthOrRedirect();

    try {
        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: "Updating ticket status",
            level: "info",
            data: { ticketId: id, userId: user.id, newStatus: status },
          });
        const ticket = await prisma.ticket.findUnique({
            where: {
                id,
            }
        });

        if (!ticket) {

            return toActionState("ERROR", "Ticket not found");
        }

        // Ensure ticket belongs to active organization
        if (ticket.organizationId !== activeOrganization!.id) {
            return toActionState("ERROR", "Switch to this ticket's organization to update status");
        }

        // Get user's membership in this organization
        const membership = await prisma.membership.findUnique({
            where: {
                membershipId: {
                    organizationId: ticket.organizationId,
                    userId: user.id
                }
            }
        });

        if (!membership) {
            return toActionState("ERROR", "Not a member of this organization");
        }

        const isTicketOwner = isOwner(user, ticket);

        // Handle marking ticket as DONE (solving/resolving)
        if (status === TicketStatus.DONE) {
            // CRITICAL: Prevent self-resolution for bounty claim
            if (isTicketOwner) {
                return toActionState("ERROR", "You cannot solve your own ticket");
            }
            
            // Check resolve permission
            if (!membership.canResolveTickets) {
                return toActionState("ERROR", "You do not have permission to resolve tickets");
            }

            // Record solver and set bounty as unapproved
            await prisma.ticket.update({
                where: { id },
                data: {
                    status,
                    solvedByUserId: user.id,
                    solvedAt: new Date(),
                    bountyApproved: false,
                },
            });

            try {
                await trackTicketStatusChanged(user.id, ticket.organizationId, {
                    ticketId: id,
                    status: TicketStatus.DONE,
                });
            } catch (posthogError) {
                if (process.env.NODE_ENV === "development") {
                    console.error('[PostHog] Failed to track ticket event:', posthogError);
                }
                captureSentryError(posthogError, {
                    userId: user.id,
                    organizationId: activeOrganization!.id,
                    action: "track-ticket-status-changed",
                    level: "warning",
                    tags: { analytics: "posthog" },
                });
            }
        } else {
            // Only owner can change to other statuses (reopen, in_progress)
            if (!isTicketOwner) {
                return toActionState("ERROR", "Only ticket creator can change this status");
            }

            // If reopening a solved ticket, reset approval but preserve history
            const updateData: {status: TicketStatus; bountyApproved?: boolean} = { status };
            if (ticket.solvedByUserId) {
                updateData.bountyApproved = false;
            }

            await prisma.ticket.update({
                where: { id },
                data: updateData,
            });

            try {
                await trackTicketStatusChanged(user.id, ticket.organizationId, {
                    ticketId: id,
                    status,
                });
            } catch (posthogError) {
                if (process.env.NODE_ENV === "development") {
                    console.error('[PostHog] Failed to track ticket event:', posthogError);
                }
                captureSentryError(posthogError, {
                    userId: user.id,
                    organizationId: activeOrganization!.id,
                    action: "track-ticket-status-changed",
                    level: "warning",
                    tags: { analytics: "posthog" },
                });
            }
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: activeOrganization!.id,
            ticketId: id,
            action: "update-ticket-status",
            level: "error",
        });
        return fromErrorToActionState(error)
    }

    revalidatePath(ticketsPath());

    return toActionState("SUCCESS", "Status updated");

}