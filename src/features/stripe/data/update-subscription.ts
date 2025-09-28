import Stripe from "stripe";
import {prisma} from "@/lib/prisma";
import { StripeSubscriptionStatus } from "@prisma/client";

export const updateStripeSubscription = async (subscription: Stripe.Subscription, eventAt: number) => {
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
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status as StripeSubscriptionStatus,
                productId: subscription.items.data[0].price.product as string,
                priceId: subscription.items.data[0].price.id as string,
                eventAt, // Store the event timestamp
            }
        });
    } else {
        // Log only when race condition is actually prevented
        console.log(`Race condition prevented: Skipping outdated Stripe event for customer ${subscription.customer}`);
    }
}