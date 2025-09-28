import {Suspense} from "react";
import {OrganizationBreadcrumbs} from "@/app/(authenticated)/organization/[organizationId]/(admin)/_navigation/tabs";
import {Heading} from "@/components/heading"
import {Spinner} from "@/components/spinner";
import CredentialCreateButton from "@/features/credential/components/credential-create-button";
import CredentialList from "@/features/credential/components/credential-list";

type CredentialsPageProps = {
    params: Promise<{organizationId: string}>;
}

const CredentialsPage = async ({params}: CredentialsPageProps) => {
    const {organizationId} = await params;

    return (
        <div className="flex flex-1 flex-col gap-y-8">
            <Heading 
                title="Credentials"
                description="Manage your organization's credentials"
                tabs={
                    <OrganizationBreadcrumbs />
                }
                actions={<CredentialCreateButton organizationId={organizationId} />}

            />

            <Suspense fallback={<Spinner />}>
            <CredentialList organizationId={organizationId} />
            </Suspense>
        </div>
    )
}

export default CredentialsPage;