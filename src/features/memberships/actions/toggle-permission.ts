"use server"

import * as Sentry from "@sentry/nextjs";
import {revalidatePath} from "next/cache";
import {toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import { trackPermissionChanged } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {membershipsPath} from "@/paths";
type PermissionKey = "canDeleteTicket" | "canUpdateTicket";

type togglePermissionProps = {
    userId: string,
    organizationId: string,
    permissionKey: PermissionKey
}

export const togglePermission = async ({userId, organizationId, permissionKey}: togglePermissionProps) => {
    const {user} = await getAdminOrRedirect(organizationId);

    Sentry.addBreadcrumb({
        category: "membership.action",
        message: "Toggling permission",
        level: "info",
        data: { userId, organizationId, permissionKey },
    });

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

    try {
        await prisma.membership.update({
            where,
            data: {
                [permissionKey]: newValue,
            },
        });

        try {
            await trackPermissionChanged(user.id, organizationId, {
                userId: userId,
                permissionKey: permissionKey,
                permissionValue: newValue,
            });
        } catch (posthogError) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track organization event:', posthogError);
            }
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: organizationId,
                action: "track-permission-changed",
                level: "warning",
                tags: { analytics: "posthog" },
            });
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId: organizationId,
            action: "toggle-permission",
            level: "error",
        });
        return toActionState("ERROR", "Failed to update permission");
    }

    revalidatePath(membershipsPath(organizationId));

    return toActionState("SUCCESS", "Permission updated successfully");
}