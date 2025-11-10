import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {stripe} from "@/lib/stripe";

export type OrganizationCreateEventArgs = {
    data: {
        organizationId: string;
        byEmail: string;
    }
}

export const organizationCreatedEvent = inngest.createFunction(
   { id: "organization.created"},
   { event: "app/organization.created"},
    async ({event, step}) => {
        const {organizationId, byEmail} = event.data;

        try {
            const organization = await step.run("fetch-organization", async () => {
                try {
                    return await prisma.organization.findUniqueOrThrow({
                        where: {
                            id: organizationId,
                        },
                        include: {
                            memberships: {
                                include: {
                                    user: true,
                                }
                            }
                        }
                    });
                } catch (error) {
                    captureSentryError(error, {
                        organizationId,
                        action: "organization-created-fetch",
                        level: "error",
                        tags: { inngest: "organization.created", step: "fetch-organization" },
                    });
                    throw error;
                }
            });

            const stripeCustomer = await step.run("create-stripe-customer", async () => {
                try {
                    return await stripe.customers.create({
                        name: organization.name,
                        email: byEmail,
                        metadata: {
                            organizationId: organization.id
                        }
                    });
                } catch (error) {
                    captureSentryError(error, {
                        organizationId,
                        action: "organization-created-create-stripe-customer",
                        level: "error",
                        tags: { inngest: "organization.created", step: "create-stripe-customer" },
                    });
                    throw error;
                }
            });

            await step.run("save-stripe-customer", async () => {
                try {
                    await prisma.stripeCustomer.create({
                        data: {
                            organizationId: organization.id,
                            customerId: stripeCustomer.id,
                        }
                    });
                } catch (error) {
                    captureSentryError(error, {
                        organizationId,
                        action: "organization-created-save-stripe-customer",
                        level: "error",
                        tags: { inngest: "organization.created", step: "save-stripe-customer" },
                    });
                    throw error;
                }
            });

            return {event, body: true};
        } catch (error) {
            captureSentryError(error, {
                organizationId,
                action: "organization-created",
                level: "error",
                tags: { inngest: "organization.created" },
            });
            throw error;
        }
    }
)