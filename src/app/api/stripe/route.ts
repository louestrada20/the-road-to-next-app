import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as stripeData from "@/features/stripe/data";
import { stripe } from "@/lib/stripe";

const handleSubscriptionCreated = async (subscription: Stripe.Subscription, eventAt: number) => {
    await stripeData.updateStripeSubscription(subscription, eventAt);
};

const handleSubscriptionUpdate = async (subscription: Stripe.Subscription, eventAt: number) => {
    await stripeData.updateStripeSubscription(subscription, eventAt);
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription, eventAt: number) => {
    await stripeData.deleteStripeSubscription(subscription, eventAt);
};

const handlePaymentFailed = async (invoice: Stripe.Invoice, eventAt: number) => {
    await stripeData.handlePaymentFailure(invoice, eventAt);
};

const handleSubscriptionPaymentIssue = async (subscription: Stripe.Subscription, eventAt: number) => {
    await stripeData.updateStripeSubscription(subscription, eventAt);
};

export async function POST(req: Request) {
    const body = await req.text();
    const signature = ((await headers()).get("Stripe-Signature"));
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return new NextResponse("Missing webhook secret", { status: 500 });
    }

    if (!signature) {
        return new NextResponse("Missing signature", { status: 400 });
    };

    let event: Stripe.Event | null = null;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        switch (event.type) {
            case "customer.subscription.created":
                await handleSubscriptionCreated(event.data.object, event.created);
                break;
            case "customer.subscription.updated":
                await handleSubscriptionUpdate(event.data.object, event.created);
                break;
            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(event.data.object, event.created);
                break;
            case "invoice.payment_failed":
                await handlePaymentFailed(event.data.object, event.created);
                break;
            case "customer.subscription.updated":
                // Handle subscription status changes (incomplete, past_due, etc.)
                const subscription = event.data.object as Stripe.Subscription;
                if (['incomplete', 'incomplete_expired', 'past_due', 'unpaid'].includes(subscription.status)) {
                    await handleSubscriptionPaymentIssue(subscription, event.created);
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error instanceof Error ? error.message : 'Unknown error');
        return new NextResponse("Invalid Stripe Signature", { status: 400 });
    }
}