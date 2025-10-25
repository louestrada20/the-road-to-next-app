import { StripeSubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { handleSubscriptionChange } from "@/features/deprovisioning/service/handle-subscription-change";
import {prisma} from "@/lib/prisma";

export const updateStripeSubscription = async (subscription: Stripe.Subscription, eventAt: number) => {
    const stripeCustomer = await prisma.stripeCustomer.findUniqueOrThrow({
        where: {
            customerId: subscription.customer as string,
        },
    });

    // Only update if event is newer than stored timestamp (race condition protection)
    if (!stripeCustomer.eventAt || stripeCustomer.eventAt < eventAt) {
        // Store old product ID before updating
        const oldProductId = stripeCustomer.productId;
        const newProductId = subscription.items.data[0].price.product as string;
        const organizationId = stripeCustomer.organizationId;

        await prisma.stripeCustomer.update({
            where: {
                customerId: subscription.customer as string,
            },
            data: {
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status as StripeSubscriptionStatus,
                productId: newProductId,
                priceId: subscription.items.data[0].price.id as string,
                eventAt, // Store the event timestamp
            }
        });

        // Check if we need to trigger deprovisioning
        // This happens when product changes (downgrade) or subscription becomes active
        if (oldProductId !== newProductId || subscription.status === 'active') {
            try {
                await handleSubscriptionChange(organizationId, oldProductId, newProductId, eventAt);
            } catch (error) {
                console.error(`Failed to handle subscription change for org ${organizationId}:`, error);
                // Don't throw - webhook should still return 200 to Stripe
                // Deprovisioning can be manually triggered later if needed
            }
        }
    } else {
        // Log only when race condition is actually prevented
        console.log(`Race condition prevented: Skipping outdated Stripe event for customer ${subscription.customer}`);
    }
}