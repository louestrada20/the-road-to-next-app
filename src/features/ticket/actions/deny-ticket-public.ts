"use server"

import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect"
import { prisma } from "@/lib/prisma"
import { ticketPath } from "@/paths"

export const denyTicketPublic = async (ticketId: string, organizationId: string) => {
    try {
        // Verify user is admin of the organization
        await getAdminOrRedirect(organizationId);

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

    } catch {
        return toActionState("ERROR", "Failed to deny public request");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Public request denied");
}

