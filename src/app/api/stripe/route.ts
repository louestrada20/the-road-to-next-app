import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as stripeData from "@/features/stripe/data";
import {
  trackPaymentFailed,
  trackSubscriptionCanceled,
  trackSubscriptionCreated,
  trackSubscriptionUpdated,
} from "@/lib/posthog/events/stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import * as Sentry from "@sentry/nextjs";

const handleSubscriptionCreated = async (subscription: Stripe.Subscription, eventAt: number) => {
    await stripeData.updateStripeSubscription(subscription, eventAt);

    // Track subscription created in PostHog (non-blocking)
    try {
        const stripeCustomer = await prisma.stripeCustomer.findUnique({
            where: { customerId: subscription.customer as string },
        });

        if (stripeCustomer) {
            const productId = subscription.items.data[0]?.price.product as string | undefined;
            const priceId = subscription.items.data[0]?.price.id as string | undefined;

            await trackSubscriptionCreated(stripeCustomer.organizationId, subscription.id, {
                productId,
                priceId,
                status: subscription.status,
                customerId: subscription.customer as string,
            });
        }
    } catch (error) {
        // Don't break webhook flow if PostHog fails
        if (process.env.NODE_ENV === 'development') {
            console.error('[PostHog] Failed to track subscription created:', error);
        }
    }
};

const handleSubscriptionUpdate = async (subscription: Stripe.Subscription, eventAt: number) => {
    // Get old product ID before update
    const stripeCustomerBefore = await prisma.stripeCustomer.findUnique({
        where: { customerId: subscription.customer as string },
    });
    const oldProductId = stripeCustomerBefore?.productId || null;

    await stripeData.updateStripeSubscription(subscription, eventAt);

    // Track subscription updated in PostHog (non-blocking)
    try {
        const stripeCustomer = await prisma.stripeCustomer.findUnique({
            where: { customerId: subscription.customer as string },
        });

        if (stripeCustomer) {
            const newProductId = subscription.items.data[0]?.price.product as string | undefined;

            await trackSubscriptionUpdated(
                stripeCustomer.organizationId,
                subscription.id,
                oldProductId,
                newProductId || null,
                {
                    status: subscription.status,
                    priceId: subscription.items.data[0]?.price.id as string | undefined,
                    customerId: subscription.customer as string,
                }
            );
        }
    } catch (error) {
        // Don't break webhook flow if PostHog fails
        if (process.env.NODE_ENV === 'development') {
            console.error('[PostHog] Failed to track subscription updated:', error);
        }
    }
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription, eventAt: number) => {
    // Get old product ID before deletion
    const stripeCustomerBefore = await prisma.stripeCustomer.findUnique({
        where: { customerId: subscription.customer as string },
    });
    const oldProductId = stripeCustomerBefore?.productId || null;

    await stripeData.deleteStripeSubscription(subscription, eventAt);

    // Track subscription canceled in PostHog (non-blocking)
    try {
        const stripeCustomer = await prisma.stripeCustomer.findUnique({
            where: { customerId: subscription.customer as string },
        });

        if (stripeCustomer) {
            await trackSubscriptionCanceled(stripeCustomer.organizationId, subscription.id, {
                oldProductId,
                customerId: subscription.customer as string,
            });
        }
    } catch (error) {
        // Don't break webhook flow if PostHog fails
        if (process.env.NODE_ENV === 'development') {
            console.error('[PostHog] Failed to track subscription canceled:', error);
        }
    }
};

const handlePaymentFailed = async (invoice: Stripe.Invoice, eventAt: number) => {
    await stripeData.handlePaymentFailure(invoice, eventAt);

    // Track payment failed in PostHog (non-blocking)
    try {
        const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string };

        if (invoice.customer && invoiceWithSubscription.subscription) {
            const stripeCustomer = await prisma.stripeCustomer.findUnique({
                where: { customerId: invoice.customer as string },
            });

            if (stripeCustomer && invoice.id) {
                await trackPaymentFailed(
                    stripeCustomer.organizationId,
                    invoice.id,
                    invoice.amount_due,
                    {
                        subscriptionId: invoiceWithSubscription.subscription,
                        attemptCount: invoice.attempt_count,
                        currency: invoice.currency || undefined,
                        customerId: invoice.customer as string,
                    }
                );
            }
        }
    } catch (error) {
        // Don't break webhook flow if PostHog fails
        if (process.env.NODE_ENV === 'development') {
            console.error('[PostHog] Failed to track payment failed:', error);
        }
    }
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

        Sentry.addBreadcrumb({
            category: "stripe.webhook",
            message: `Processing ${event.type} event`,
            level: "info",
            data: { eventId: event.id}
        })

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
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return new NextResponse(null, { status: 200 });
    } catch (error) {

         // Determine error type for proper handling
    const isSignatureError = error instanceof Error && 
    error.message.includes('signature');

        // Try to extract customer/organization info even on error
        let customerId: string | undefined;
        let organizationId: string | undefined;
        let subscriptionInfo: {
            productId?: string | null;
            status?: string | null;
        } = {};

        // ADD THIS BLOCK (the missing lookup code):
if (event?.data?.object) {
    try {
        // Use a type assertion with a defined interface instead of 'any'
        interface StripeEventDataObject {
            customer?: string;
            subscription?: { customer?: string };
            [key: string]: unknown;
        }
        const data = event.data.object as unknown as StripeEventDataObject;
        customerId = data.customer || data.subscription?.customer;
        
        if (customerId) {
            const stripeCustomer = await prisma.stripeCustomer.findUnique({
                where: { customerId },
                select: { 
                    organizationId: true, 
                    productId: true, 
                    subscriptionStatus: true 
                }
            });
            
            if (stripeCustomer) {
                organizationId = stripeCustomer.organizationId;
                subscriptionInfo = {
                    productId: stripeCustomer.productId,
                    status: stripeCustomer.subscriptionStatus,
                };
            }
        }
    } catch (lookupError) {
        console.error('Failed to lookup customer context:', lookupError);
    }
}


       // Extract customer info lookup into separate variable for clarity
const customerContext = {
    lookupAttempted: !!customerId,
    lookupSucceeded: !!organizationId,
    customerId: customerId || null,
    organizationId: organizationId || null,
};

Sentry.captureException(error, {
    level: isSignatureError ? "warning" : "error",
    tags: {
        // Core tags - always present for filtering
        webhook: "stripe",
        errorType: isSignatureError ? "signature_invalid" : "handler_failed",
        eventType: event?.type || "event_unavailable",
        
        // Context tags - only if meaningful data exists
        ...(customerId && { customerId }),
        ...(organizationId && { organizationId }),
        ...(event?.livemode !== undefined && { 
            livemode: event.livemode ? "production" : "test" // More descriptive
        }),
    },
    contexts: {
        stripe_event: {
            id: event?.id ?? null, // Use ?? for null coalescing
            type: event?.type ?? null,
            api_version: event?.api_version ?? null,
            created: event?.created ?? null,
            request_id: event?.request?.id ?? null,
            idempotency_key: event?.request?.idempotency_key ?? null,
        },
        customer: customerContext, // Clear structure
        subscription: Object.keys(subscriptionInfo).length > 0 
            ? subscriptionInfo 
            : { available: false }, // Explicit unavailability
        request: {
            has_signature: !!signature,
            body_size: body.length,
        }
    },
    fingerprint: [
        'stripe-webhook',
        event?.type || 'unknown-type',
        isSignatureError ? 'signature-error' : 'handler-error'
    ]
});

       
        console.error('Error processing webhook:', {
            eventType: event?.type,
            eventId: event?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            customerId,
            organizationId,
        });
    
        // Return appropriate status code
        if (isSignatureError) {
            return new NextResponse("Invalid Stripe Signature", { status: 400 });
        }

        return new NextResponse("Webhook Handler Failed", { status: 500 });
    }
}