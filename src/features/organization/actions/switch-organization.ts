"use server"

import {revalidatePath} from "next/cache";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {getOrganizationsByUser} from "@/features/organization/queries/get-organizations-by-user";
import { trackOrganizationSwitched } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {organizationPath} from "@/paths";
export const switchOrganization = async (organizationId: string) => {
    const {user}  = await getAuthOrRedirect({
        checkActiveOrganization: false,
    });


    try {
        const organizations = await getOrganizationsByUser();
        const canSwitch  = organizations.some((organization) => organization.id === organizationId)
        if (!canSwitch) {
            return toActionState("ERROR", "Not a member of this organization");
        }
        //toggle any current active memberships to be inactive.
        await prisma.$transaction([
             prisma.membership.updateMany({
                where: {
                    userId: user.id,
                    organizationId: {
                        not: organizationId,
                    }
                },
                data: {
                    isActive: false,
                }
            }),
        prisma.membership.update({
            where: {
                membershipId: {
                    organizationId,
                    userId: user.id
                }
            },
            data: {
                isActive: true
            }
        })
        ])
        try {
            await trackOrganizationSwitched(user.id, organizationId);
        } catch (posthogError) {
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId,
                action: "track-organization-switched",
                level: "warning", // Analytics failure is non-critical
                tags: { analytics: "posthog" },
            });

            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track organization event:', posthogError);
            }
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId,
            action: "switch-organization",
            level: "error", // Critical business operation
        });

        return fromErrorToActionState(error);
    }

    revalidatePath(organizationPath());

    return toActionState("SUCCESS", "Active organization has been switched");
}