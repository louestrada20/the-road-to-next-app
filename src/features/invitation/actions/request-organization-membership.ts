"use server"

import { z } from "zod"
import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { getAuth } from "@/features/auth/actions/get-auth"
import { prisma } from "@/lib/prisma"
import { generateRandomToken, hashToken } from "@/utils/crypto"

const requestMembershipSchema = z.object({
    email: z.string().min(1, { message: "Email is required" }).max(191).email(),
    organizationId: z.string().min(1),
    ticketId: z.string().optional(),
})

export const requestOrganizationMembership = async (
    _actionState: ActionState,
    formData: FormData
) => {
    const { user } = await getAuth();

    try {
        const { email, organizationId, ticketId } = requestMembershipSchema.parse({
            email: formData.get("email"),
            organizationId: formData.get("organizationId"),
            ticketId: formData.get("ticketId"),
        });

        // Use authenticated user's email if available
        const requestEmail = user?.email || email;

        // Check if user is already a member
        if (user) {
            const existingMembership = await prisma.membership.findFirst({
                where: {
                    organizationId,
                    userId: user.id
                }
            });

            if (existingMembership) {
                return toActionState("ERROR", "You are already a member of this organization");
            }
        }

        // Check if request already exists
        const existingRequest = await prisma.invitation.findFirst({
            where: {
                organizationId,
                email: requestEmail,
                status: "REQUESTED"
            }
        });

        if (existingRequest) {
            return toActionState("ERROR", "You have already requested to join this organization");
        }

        // Create membership request
        const tokenId = generateRandomToken();
        const tokenHash = hashToken(tokenId);

        await prisma.invitation.create({
            data: {
                tokenHash,
                email: requestEmail,
                organizationId,
                invitedByUserId: null, // User-initiated request
                status: "REQUESTED",
                requestedFromTicketId: ticketId || null,
            },
        });

        // TODO: In future, send notification to admins via Inngest

    } catch (error) {
        return fromErrorToActionState(error);
    }

    return toActionState("SUCCESS", "Your request has been sent to the organization admins");
}

