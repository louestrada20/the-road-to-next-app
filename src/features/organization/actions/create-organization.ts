"use server"
import { Organization } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import {redirect} from "next/navigation";
import {z} from "zod";
import {setCookieByKey} from "@/actions/cookies";
import {ActionState, fromErrorToActionState,} from "@/components/form/utils/to-action-state"
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {inngest} from "@/lib/inngest";
import { trackOrganizationCreated } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {ticketsPath} from "@/paths";
import { membershipsPath } from "@/paths";

const createOrganizationSchema = z.object({
    name: z.string().min(1).max(191),
});

export const createOrganization = async (_actionState: ActionState, formData: FormData) => {
    const {user} = await getAuthOrRedirect({
        checkOrganization: false,
        checkActiveOrganization: false,
    });


    let organization: Organization;

    try {
        Sentry.addBreadcrumb({
            category: "organization.action",
            message: "Creating organization",
            level: "info",
            data: { userId: user.id },
        });

        const data = createOrganizationSchema.parse({
            name: formData.get("name"),
        });

        organization = await prisma.$transaction(async (tx) => {
            const org  =  await tx.organization.create({
                data: {
                    ...data,
                    memberships: {
                        create: {
                            userId: user.id,
                            isActive: true,
                            membershipRole: "ADMIN"
                        }
                    }
                }
            });
            await tx.membership.updateMany({
                where: {
                    userId: user.id,
                    organizationId: {
                        not: org.id,
                    }
                },
                data: {
                    isActive: false,
                }
            })
            return org;
        })


        await inngest.send({
            name: "app/organization.created",
            data: {
                organizationId: organization.id,
                byEmail: user.email,
            }
        });

        try {
            await trackOrganizationCreated(user.id, organization.id, {
                organizationId: organization.id,
                organizationName: organization.name,
            });
        } catch (posthogError) {
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: organization.id,
                action: "track-organization-created",
                level: "warning", // Analytics failure is non-critical
                tags: { analytics: "posthog" },
            });

            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track organization created event:', posthogError);
            }
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            action: "create-organization",
            level: "error", // Critical business operation
        });

        return fromErrorToActionState(error);
    }
    await setCookieByKey("toast",   
         `<a href=${membershipsPath(organization.id)}>Organization </a> created`
        );
    redirect(ticketsPath());
}