"use server";

import {redirect} from "next/navigation";
import { toActionState } from "@/components/form/utils/to-action-state";
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect";
import {prisma} from "@/lib/prisma";
import { stripe } from "@/lib/stripe";  
import {pricingPath, signInPath, subscriptionPath} from "@/paths";
import { getBaseUrl } from "@/utils/url";


export const createCheckoutSession = async (organizationId: string | null | undefined, priceId: string) => {
    if (!organizationId) {
        redirect(signInPath());
    };

    let sessionUrl: string;

    try {
        await getAdminOrRedirect(organizationId);

        const stripeCustomer = await prisma.stripeCustomer.findUnique({
            where: {
                organizationId,
            }
        });

        if (!stripeCustomer) {
            return toActionState("ERROR", "Stripe customer not found")
        };

        // Handle Stripe API errors for price retrieval
        const price = await stripe.prices.retrieve(priceId);
        
        if (!price.active) {
            return toActionState("ERROR", "Selected price is no longer available");
        }

        // Handle Stripe API errors for session creation
        const session = await stripe.checkout.sessions.create({
            billing_address_collection: "auto",
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            customer: stripeCustomer.customerId,
            mode: "subscription",
            success_url: `${getBaseUrl()}${subscriptionPath(organizationId)}`,
            cancel_url: `${getBaseUrl()}${pricingPath()}`,
            metadata: {
                organizationId,
            },
            subscription_data: {
                metadata: {
                    organizationId,
                },
            },
        });

        if (!session.url) {
            return toActionState("ERROR", "Session URL could not be created")
        }

        sessionUrl = session.url;
        
    } catch (error) {
        console.error('Stripe checkout session creation failed:', error);
        
        // Handle specific Stripe errors
        if (error instanceof Error) {
            if (error.message.includes('No such price')) {
                return toActionState("ERROR", "Selected price plan not found");
            }
            if (error.message.includes('No such customer')) {
                return toActionState("ERROR", "Customer account not found");
            }
            if (error.message.includes('card_declined')) {
                return toActionState("ERROR", "Payment method declined");
            }
            if (error.message.includes('insufficient_funds')) {
                return toActionState("ERROR", "Insufficient funds");
            }
        }
        
        return toActionState("ERROR", "Unable to create checkout session. Please try again.");
    }

    // Redirect outside of try/catch to avoid catching NEXT_REDIRECT
    redirect(sessionUrl);
}