"use server"

import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"
import { isOwner } from "@/features/auth/utils/is-owner"
import { prisma } from "@/lib/prisma"
import { ticketPath } from "@/paths"

export const requestTicketPublic = async (ticketId: string) => {
    const { user } = await getAuthOrRedirect();

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return toActionState("ERROR", "Ticket not found");
        }

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

    } catch {
        return toActionState("ERROR", "Failed to request public visibility");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Request sent to admins for approval");
}

