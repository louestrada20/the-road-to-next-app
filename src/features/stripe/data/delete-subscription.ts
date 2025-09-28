import Stripe from "stripe";
import {prisma} from "@/lib/prisma";

export const deleteStripeSubscription = async (subscription: Stripe.Subscription, eventAt: number) => {
    const stripeCustomer = await prisma.stripeCustomer.findUniqueOrThrow({
        where: {
            customerId: subscription.customer as string,
        },
    });

    // Only update if event is newer than stored timestamp (race condition protection)
    if (!stripeCustomer.eventAt || stripeCustomer.eventAt < eventAt) {
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
    } else {
        // Log only when race condition is actually prevented
        console.log(`Race condition prevented: Skipping outdated Stripe deletion event for customer ${subscription.customer}`);
    }
}