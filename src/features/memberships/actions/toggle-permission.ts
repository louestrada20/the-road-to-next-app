"use server"

import {revalidatePath} from "next/cache";
import {toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {prisma} from "@/lib/prisma";
import {membershipsPath} from "@/paths";

type PermissionKey = "canDeleteTicket" | "canUpdateTicket";

type togglePermissionProps = {
    userId: string,
    organizationId: string,
    permissionKey: PermissionKey
}

export const togglePermission = async ({userId, organizationId, permissionKey}: togglePermissionProps) => {
    await getAdminOrRedirect(organizationId);

    const where = {
        membershipId: {
            userId,
            organizationId,
        }
    }

    const membership = await prisma.membership.findUnique({
        where
    });

    if (!membership) {
        return toActionState("ERROR", "Membership not found");
    }

    await prisma.membership.update({
        where,
        data: {
            [permissionKey]: membership[permissionKey] === true ? false : true,
        },
    });

    revalidatePath(membershipsPath(organizationId));

    return toActionState("SUCCESS", "Permission updated successfully");
}