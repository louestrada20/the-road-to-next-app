"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import { z } from "zod";
import {setCookieByKey} from "@/actions/cookies";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import {getTicketPermissions} from "@/features/ticket/permissions/get-ticket-permission";
import { trackTicketCreated, trackTicketUpdated } from "@/lib/posthog/events/tickets";
import {prisma} from "@/lib/prisma";
import { ticketPath, ticketsPath} from "@/paths";
import {toCent} from "@/utils/currency";
import * as Sentry from "@sentry/nextjs";
import { captureSentryError } from "@/lib/sentry/capture-error";



const upsertTicketSchema = z.object({
    title: z.string().min(1).max(191),
    content: z.string().min(1).max(1024),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Is required'),
    bounty: z.coerce.number().positive(),
})

export const upsertTicket = async (
    id: string | undefined,
    _actionState: ActionState,
    formData: FormData
) => {

const {user, activeOrganization} = await getAuthOrRedirect();



    try {
        Sentry.addBreadcrumb({
            category: "ticket.action",
            message: id ? "Updating ticket" : "Creating ticket",
            level: "info",
            data: { ticketId: id, userId: user.id },
          });

        if (id) {
            const ticket = await prisma.ticket.findUnique({
                where: {
                    id,
                }
            });

            if (!ticket || !isOwner(user, ticket)) {
                return toActionState("ERROR", "Not authorized");
            }

            // Check update permission
            const permissions = await getTicketPermissions({
                organizationId: ticket.organizationId,
                userId: user.id
            });

            if (!permissions.canUpdateTicket) {
                return toActionState("ERROR", "You do not have permission to update tickets");
            }
        }

        const data = upsertTicketSchema.parse({
            title: formData.get("title"),
            content: formData.get("content"),
            deadline: formData.get("deadline"),
            bounty: formData.get("bounty"),
        });

        const dbData = {
            ...data,
            userId: user.id,
            bounty: toCent(data.bounty),
        }

      const upsertedTicket = await prisma.ticket.upsert({
            where: {
                id: id || "",
            },
            update: dbData,
            create: {...dbData, organizationId: activeOrganization!.id},
        })

        try {
            if (id) {
                await trackTicketUpdated(user.id, upsertedTicket.organizationId, {
                    ticketId: id,
                    hasBounty: data.bounty > 0,
                    hasDeadline: !!data.deadline,
                });
            } else {
                await trackTicketCreated(user.id, upsertedTicket.organizationId, {
                    ticketId: upsertedTicket.id,    
                    hasBounty: data.bounty > 0,
                    hasDeadline: !!data.deadline,
                });
            }
        } catch (posthogError) {

            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track ticket event:', posthogError);
            }
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: activeOrganization!.id,
                action: "track-ticket-created",
                level: "warning", // Analytics failure is non-critical
                tags: { analytics: "posthog" },
              });
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: activeOrganization!.id,
            ticketId: id,
            action: "upsert-ticket",
            level: "error", // Critical business operation
          });
          
        return fromErrorToActionState(error, formData);
    }

    revalidatePath(ticketsPath());

if (id) {
   await setCookieByKey("toast", "Ticket Updated");
    redirect(ticketPath(id));

}

return toActionState("SUCCESS", "Ticket created");
}