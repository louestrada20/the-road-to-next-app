import { Heading } from "@/components/heading";

 
import { OrganizationBreadcrumbs } from "../_navigation/tabs";
   
import { LucideSettings2 } from "lucide-react";
import { CustomerPortalForm } from "@/features/stripe/components/customer-portal-form"; 
import { Suspense } from "react";
import { Spinner } from "@/components/spinner";
import { Products } from "@/features/stripe/components/products";

type SubscriptionPageProps = {
    params: Promise<{organizationId: string}>;
};

const SubscriptionPage = async ({params}: SubscriptionPageProps) => {
    const {organizationId} = await params;

    return (
            <div className="fex-1 flex flex-col gap-y-8">
                <Heading 
                title="Subscription"
                description="Manage your subscription details"
                tabs={<OrganizationBreadcrumbs  />}
                actions={
                    <CustomerPortalForm organizationId={organizationId}>
                        <>
                        <LucideSettings2 className="h-4 w-4" />
                        Manage Subscription
                        </>
                        </CustomerPortalForm>
                }
                />
           
                <Suspense fallback={<Spinner />}> 
                <Products organizationId={organizationId} />
                </Suspense>

            </div>
    )
}

export default SubscriptionPage