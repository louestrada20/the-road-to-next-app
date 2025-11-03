"use server"

import {revalidatePath} from "next/cache";
import {toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import { trackPermissionChanged } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import {membershipsPath} from "@/paths";
type PermissionKey = "canDeleteTicket" | "canUpdateTicket";

type togglePermissionProps = {
    userId: string,
    organizationId: string,
    permissionKey: PermissionKey
}

export const togglePermission = async ({userId, organizationId, permissionKey}: togglePermissionProps) => {
    const {user} = await getAdminOrRedirect(organizationId);

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
    const newValue = membership[permissionKey] === true ? false : true;

    await prisma.membership.update({
        where,
        data: {
            [permissionKey]: newValue,
        },
    });
    
    try {
        await trackPermissionChanged(user.id, organizationId, {  // ✅ Use user from getAdminOrRedirect
            userId: userId,
            permissionKey: permissionKey,
            permissionValue: newValue,
        });
    } catch (posthogError) {
        if (process.env.NODE_ENV === "development") {
            console.error('[PostHog] Failed to track organization event:', posthogError);
        }
    }
    revalidatePath(membershipsPath(organizationId));

    return toActionState("SUCCESS", "Permission updated successfully");
}