import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * Handle payment failures for invoices
 * This gets called when invoice.payment_failed webhook is received
 */
export const handlePaymentFailure = async (invoice: Stripe.Invoice, eventAt: number) => {
    // Type assertion needed because subscription field exists on invoice but isn't in base type
    const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string };
    
    if (!invoice.customer || !invoiceWithSubscription.subscription) {
        console.log('Payment failed for invoice without customer or subscription:', invoice.id);
        return;
    }

    const stripeCustomer = await prisma.stripeCustomer.findUnique({
        where: {
            customerId: invoice.customer as string,
        },
    });

    if (!stripeCustomer) {
        console.log('Payment failed for unknown customer:', invoice.customer);
        return;
    }

    // Only process if this is a newer event (race condition protection)
    if (!stripeCustomer.eventAt || stripeCustomer.eventAt < eventAt) {
        console.log(`Payment failed for customer ${invoice.customer}:`, {
            invoiceId: invoice.id,
            subscriptionId: invoiceWithSubscription.subscription,
            amountDue: invoice.amount_due,
            currency: invoice.currency,
            attemptCount: invoice.attempt_count,
            nextPaymentAttempt: invoice.next_payment_attempt,
        });

        // Update the subscription status to reflect payment failure
        // The subscription status will be updated by subsequent subscription.updated events
        // but we can log the payment failure for monitoring/alerts
        
        await prisma.stripeCustomer.update({
            where: {
                customerId: invoice.customer as string,
            },
            data: {
                eventAt, // Update event timestamp
            }
        });

        // TODO: Add your business logic here:
        // - Send email notification to customer about payment failure
        // - Create internal notification for admin
        // - Potentially downgrade service access
        // - Set up retry logic if needed
        
        console.log(`Payment failure logged for customer ${invoice.customer}`);
    } else {
        console.log(`Race condition prevented: Skipping outdated payment failure event for customer ${invoice.customer}`);
    }
};
