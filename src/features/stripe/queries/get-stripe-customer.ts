import {prisma} from "@/lib/prisma";

export const getStripeCustomerByOrganization = async (organizationId: string | null | undefined) => { 
    if (!organizationId) {
        return null;
    }

    const stripeCustomer = await prisma.stripeCustomer.findUnique({
        where: {
            organizationId,
        },
    });

    return stripeCustomer;
}