"use server"
import { toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {getMemberships} from "@/features/memberships/queries/get-memberships";
import {prisma} from "@/lib/prisma";


type deleteMembershipProps = {
        organizationId: string,
        userId: string,
}

export const deleteMembership = async ({organizationId, userId}: deleteMembershipProps) => {
   const {user} =  await getAuthOrRedirect();

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

        await prisma.membership.delete({
            where: {
                membershipId: {
                    organizationId,
                    userId
                }
            }
        }
        );


    return toActionState("SUCCESS", "Membership deleted successfully.");
}