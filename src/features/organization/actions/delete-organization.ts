"use server"

import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {getOrganizationsByUser} from "@/features/organization/queries/get-organizations-by-user";
import {prisma} from "@/lib/prisma";


export const deleteOrganization = async (organizationId: string) => {
    await getAdminOrRedirect(organizationId);


    try {
        const organizationsUserBelongsTo = await getOrganizationsByUser();

        const canDelete = organizationsUserBelongsTo.some((organization) => organization.id === organizationId);

        if (!canDelete) {
            return toActionState("ERROR", "Not Authorized")
        }

        await prisma.organization.delete({
        where: {
            id: organizationId,
        }
    })
        // await setCookieByKey("toast", "Organization deleted successfully");
        // possible solution to the success message not showing from action state?
        // since component unmounts before it can be displayed. 

    } catch (error) {
        return fromErrorToActionState(error);
    }


    return toActionState("SUCCESS", "Organization deleted");

}