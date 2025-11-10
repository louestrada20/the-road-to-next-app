"use server";

import * as Sentry from "@sentry/nextjs";
import {toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";


type DeleteInvitation = {
    email: string,
    organizationId: string,
}

export const deleteInvitation = async ({email, organizationId}: DeleteInvitation) => {
    const {user} = await getAdminOrRedirect(organizationId);

    Sentry.addBreadcrumb({
        category: "invitation.action",
        message: "Deleting invitation",
        level: "info",
        data: { email, organizationId },
    });

    const invitation = await prisma.invitation.findUnique({
        where: {
            invitationId: {
                email,
                organizationId,
            }
        },
    });

    if (!invitation) {
        return toActionState("ERROR", "Invitation not found");
    }

    try {
        await prisma.invitation.delete({
            where: {
                invitationId: {
                email,
                organizationId,
                }
            },
        });
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,
            action: "delete-invitation",
            level: "error",
        });
        return toActionState("ERROR", "Failed to delete invitation");
    }

    return toActionState("SUCCESS", "Invitation deleted");
}