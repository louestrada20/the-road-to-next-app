"use server"
import * as Sentry from "@sentry/nextjs";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {setCookieByKey} from "@/actions/cookies";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import {getTicketPermissions} from "@/features/ticket/permissions/get-ticket-permission";
import { trackTicketDeleted } from "@/lib/posthog/events/tickets";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {ticketsPath} from "@/paths";

export const deleteTicket = async (id: string) => {
    const {user} = await getAuthOrRedirect();

    let organizationId: string | undefined;
    try {
        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: "Deleting ticket",
            level: "info",
            data: { ticketId: id, userId: user.id },
          });
        const ticket = await prisma.ticket.findUnique({
            where: {
                 id,
                }
        });

            if (!ticket || !isOwner(user, ticket)) {
                return toActionState("ERROR", "Not authorized");
            }
            organizationId = ticket.organizationId;

            const permissions = await getTicketPermissions({
                organizationId: ticket.organizationId,
                userId: user.id
            });

            if (!permissions.canDeleteTicket) {
                return toActionState("ERROR", "Not authorized");
            }

        await prisma.ticket.delete({
            where: {id}
        });

        try {
            await trackTicketDeleted(user.id, ticket.organizationId, {
                ticketId: id,
            });
        } catch (posthogError) {    
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track ticket event:', posthogError);
            }
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: ticket.organizationId,
                action: "track-ticket-deleted",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,    
            ticketId: id,
            action: "delete-ticket",
            level: "error",
        });
        return fromErrorToActionState(error);
    }


    revalidatePath((ticketsPath()))
   await setCookieByKey("toast", "Ticket deleted");
    redirect(ticketsPath());
}
