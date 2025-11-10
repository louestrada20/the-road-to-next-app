"use server"
import * as Sentry from "@sentry/nextjs";
import { toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {getMemberships} from "@/features/memberships/queries/get-memberships";
import { trackMembershipDeleted } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";

type deleteMembershipProps = {
        organizationId: string,
        userId: string,
}

export const deleteMembership = async ({organizationId, userId}: deleteMembershipProps) => {
   const {user} =  await getAuthOrRedirect();

    Sentry.addBreadcrumb({
        category: "membership.action",
        message: "Deleting membership",
        level: "info",
        data: { userId, organizationId },
    });

    const memberships = await getMemberships(organizationId);

    //Check if last member
    const isLastMembership = (memberships ?? []).length ===1;

    if (isLastMembership) {
        return toActionState("ERROR", "You can't delete the last membership of an organization");
    }

    // check if membership exists that we are trying to delete, the target.
    const targetMembership = (memberships ?? []).find((membership) => membership.userId === userId);
    if (!targetMembership) {
        return toActionState("ERROR", "Membership not found")
    }

    const adminMemberships = (memberships ?? []).filter((membership) => membership.membershipRole === "ADMIN");

    const removesAdmin = targetMembership.membershipRole === "ADMIN";
    const isLastAdmin = adminMemberships.length <= 1;

    // don't allow organizations without Admin users.
    if (removesAdmin && isLastAdmin) {
        return toActionState("ERROR", "You cannot delete the last admin of an organization");
    }


    // check if user is authorized.

    const myMembership = (memberships ?? []).find((membership) => membership.userId === user?.id);

    const isMyself = user.id === userId;
    const isAdmin = myMembership?.membershipRole === "ADMIN";

    if (!isAdmin && !isMyself) {
        return toActionState("ERROR", "You can only delete memberships as an admin")
    }

    try {
        await prisma.membership.delete({
            where: {
                membershipId: {
                    organizationId,
                    userId
                }
            }
        });

        try {
            await trackMembershipDeleted(userId, organizationId, {
                removedUserId: userId,
                membershipRole: targetMembership.membershipRole,
            });
        } catch (posthogError) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track organization event:', posthogError);
            }
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: organizationId,
                action: "track-membership-deleted",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,
            action: "delete-membership",
            level: "error",
        });
        return toActionState("ERROR", "Failed to delete membership");
    }

    return toActionState("SUCCESS", "Membership deleted successfully.");
}