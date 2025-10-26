"use server"

import { revalidatePath } from "next/cache"
import { toActionState } from "@/components/form/utils/to-action-state"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"
import { isOwner } from "@/features/auth/utils/is-owner"
import { prisma } from "@/lib/prisma"
import { ticketPath } from "@/paths"

export const approveBountyPayment = async (ticketId: string) => {
    const { user } = await getAuthOrRedirect();

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return toActionState("ERROR", "Ticket not found");
        }

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

    } catch (error) {
        return toActionState("ERROR", "Failed to approve bounty");
    }

    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Bounty approved and marked as paid!");
}

