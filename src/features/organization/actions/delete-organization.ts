"use server"

import * as Sentry from "@sentry/nextjs";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {getOrganizationsByUser} from "@/features/organization/queries/get-organizations-by-user";
import {inngest} from "@/lib/inngest";
import { trackOrganizationDeleted } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";

export const deleteOrganization = async (organizationId: string) => {
    const {user} = await getAdminOrRedirect(organizationId);

    try {
        Sentry.addBreadcrumb({
            category: "organization.action",
            message: "Deleting organization",
            level: "info",
            data: { organizationId, userId: user.id },
        });

        const organizationsUserBelongsTo = await getOrganizationsByUser();

        const canDelete = organizationsUserBelongsTo.some((organization) => organization.id === organizationId);

        if (!canDelete) {
            return toActionState("ERROR", "Not Authorized")
        }

        // Get organization details before deletion for the cleanup event
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true }
        });

        if (!organization) {
            return toActionState("ERROR", "Organization not found")
        }

        // Trigger the cleanup event before deleting the organization
        await inngest.send({
            name: "app/organization.deleted",
            data: {
                organizationId: organization.id,
                organizationName: organization.name,
            }
        });

        try {
            await trackOrganizationDeleted(user.id, organization.id, {
                organizationId: organization.id,
                organizationName: organization.name,
            });
        } catch (posthogError) {
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: organization.id,
                action: "track-organization-deleted",
                level: "warning", // Analytics failure is non-critical
                tags: { analytics: "posthog" },
            });

            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track organization event:', posthogError);
            }
        }

        // Delete the organization (this will cascade delete tickets, attachments, etc.)
        await prisma.organization.delete({
            where: {
                id: organizationId,
            }
        });

        

        // await setCookieByKey("toast", "Organization deleted successfully");
        // possible solution to the success message not showing from action state?
        // since component unmounts before it can be displayed. 

    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            organizationId,
            action: "delete-organization",
            level: "error", // Critical business operation
        });

        return fromErrorToActionState(error);
    }

    return toActionState("SUCCESS", "Organization deleted");
}