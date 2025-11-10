"use server"

import * as Sentry from "@sentry/nextjs";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {generateInvitationLink} from "@/features/invitation/utils/generate-invitation-link";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {getStripeProvisioningByOrganization} from "@/features/stripe/queries/get-stripe-provisioning";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {invitationsPath} from "@/paths";

const createInvitationSchema = z.object({
    email: z.string().min(1, {message: "Email is required"}).max(191).email(),
});

export const createInvitation =  async (
    organizationId: string,
    _actionState: ActionState,
    formData: FormData,
) => {
    const { user } = await getAdminOrRedirect(organizationId);

    Sentry.addBreadcrumb({
        category: "invitation.action",
        message: "Creating invitation",
        level: "info",
        data: { organizationId },
    });

    const {allowedMembers, currentMembers} = await getStripeProvisioningByOrganization(organizationId);


    if (allowedMembers <= currentMembers) {
        return toActionState(
            "ERROR",
            "Upgrade your subscription to invite more members"
        )
    };

    
    try {
        const {email} = createInvitationSchema.parse({
            email: formData.get("email"),
        });

        const targetMembership = await prisma.membership.findFirst({
            where: {
                organizationId,
                user: { email }
            }
        });
        if (targetMembership) {
            return toActionState("ERROR", "User is already a member of this organization")
        }

        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            organizationId,
            email,
          }
        });
        if (existingInvitation) {
          return toActionState("ERROR", "An invitation for this email already exists for this organization.");
        }

        const emailInvitationLink = await generateInvitationLink(user.id, organizationId, email);

        await inngest.send({
            name: "app/invitation.created",
            data: {
                userId: user.id,
                organizationId,
                email,
                emailInvitationLink
            },
        });

    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,
            action: "create-invitation",
            level: "error",
        });
        return fromErrorToActionState(error, formData);
    }

    revalidatePath(invitationsPath(organizationId));
    return toActionState("SUCCESS", "User invited to organization successfully")
}