import Stripe from "stripe";
import { handleSubscriptionChange } from "@/features/deprovisioning/service/handle-subscription-change";
import {prisma} from "@/lib/prisma";

export const deleteStripeSubscription = async (subscription: Stripe.Subscription, eventAt: number) => {
    const stripeCustomer = await prisma.stripeCustomer.findUniqueOrThrow({
        where: {
            customerId: subscription.customer as string,
        },
    });

    // Only update if event is newer than stored timestamp (race condition protection)
    if (!stripeCustomer.eventAt || stripeCustomer.eventAt < eventAt) {
        // Store old product ID before deleting
        const oldProductId = stripeCustomer.productId;
        const organizationId = stripeCustomer.organizationId;

        await prisma.stripeCustomer.update({
            where: {
                customerId: subscription.customer as string,    
            },
            data: {
                subscriptionId: null,
                subscriptionStatus: null,
                productId: null,
                priceId: null,
                eventAt, // Store the event timestamp
            },
        });

        // Trigger deprovisioning - subscription canceled means limit to 1 member
        try {
            await handleSubscriptionChange(organizationId, oldProductId, null, eventAt);
        } catch (error) {
            console.error(`Failed to handle subscription deletion for org ${organizationId}:`, error);
            // Don't throw - webhook should still return 200 to Stripe
        }
    } else {
        // Log only when race condition is actually prevented
        console.log(`Race condition prevented: Skipping outdated Stripe deletion event for customer ${subscription.customer}`);
    }
}