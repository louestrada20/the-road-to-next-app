/**
 * Utility to verify the current state after race condition testing
 * 
 * Run this to check that your database has the correct final state
 * after running race condition tests.
 */

import { prisma } from "@/lib/prisma";

export const verifyStripeCustomerState = async (customerId: string) => {
    const customer = await prisma.stripeCustomer.findUnique({
        where: { customerId },
        include: { organization: true }
    });

    if (!customer) {
        console.log(`❌ Customer ${customerId} not found`);
        return null;
    }

    console.log(`📊 [RACE CONDITION TEST] Current database state:`, {
        customerId: customer.customerId,
        subscriptionId: customer.subscriptionId,
        subscriptionStatus: customer.subscriptionStatus,
        productId: customer.productId,
        priceId: customer.priceId,
        eventAt: customer.eventAt,
        eventAtDate: customer.eventAt ? new Date(customer.eventAt * 1000).toISOString() : null,
        organizationName: customer.organization.name
    });

    return customer;
};

export const listAllStripeCustomers = async () => {
    const customers = await prisma.stripeCustomer.findMany({
        include: { organization: true },
        orderBy: { eventAt: 'desc' }
    });

    console.log(`📊 [RACE CONDITION TEST] All Stripe customers:`, 
        customers.map(c => ({
            customerId: c.customerId,
            subscriptionStatus: c.subscriptionStatus,
            eventAt: c.eventAt,
            eventAtDate: c.eventAt ? new Date(c.eventAt * 1000).toISOString() : null,
            orgName: c.organization.name
        }))
    );

    return customers;
};

/**
 * Usage in testing:
 * 
 * 1. After running webhook tests, call this in a separate script:
 *    ```typescript
 *    import { verifyStripeCustomerState } from "@/features/stripe/utils/verify-race-condition-state";
 *    
 *    // Check specific customer
 *    await verifyStripeCustomerState("cus_xxxxx");
 *    
 *    // Or list all customers
 *    await listAllStripeCustomers();
 *    ```
 */
