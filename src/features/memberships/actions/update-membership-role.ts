"use server"
import {MembershipRole} from "@prisma/client";
import {revalidatePath} from "next/cache";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {getMemberships} from "@/features/memberships/queries/get-memberships";
import { trackMembershipRoleUpdated } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import {membershipsPath} from "@/paths";
type updateMembershipRoleProps = {
    userId: string,
    organizationId: string,
    membershipRole: MembershipRole
}

export const updateMembershipRole = async ({userId, organizationId, membershipRole}: updateMembershipRoleProps) => {
    await getAdminOrRedirect(organizationId);

    const memberships = await getMemberships(organizationId);

    // check if membership exists

    const targetMembership = (memberships ?? []).find(membership => membership.userId === userId);

    if (!targetMembership) {
        return toActionState("ERROR", "Membership not found!")
    }

    // check if last admin?
        //Filter all memberhsips and get admins only
    const adminMemberships = (memberships ?? []).filter((membership) => membership.membershipRole === "ADMIN");

        // only admins can remove or upgrade/downgrade memberships
    const removesAdmin = targetMembership.membershipRole === "ADMIN";
            //Last admin cannot be removed or downgraded to a member.
    const isLastAdmin = adminMemberships.length <= 1;

    if (removesAdmin && isLastAdmin) {
        return toActionState("ERROR", "You cannot remove the last admin of an organization");
    }

    try {
        
        await prisma.membership.update({
            where: {
                membershipId: {
                    organizationId,
                    userId
                },
            },
            data: {
                membershipRole,
            },
        })
        try {
            await trackMembershipRoleUpdated(userId, organizationId, {
                userId: userId,
                oldRole: targetMembership.membershipRole,
                newRole: membershipRole,
            });
        } catch (posthogError) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track organization event:', posthogError);
            }
        }

    } catch (error) {
        return fromErrorToActionState(error);
    }

    revalidatePath(membershipsPath(organizationId))
    return toActionState("SUCCESS", "Role updated!");
}