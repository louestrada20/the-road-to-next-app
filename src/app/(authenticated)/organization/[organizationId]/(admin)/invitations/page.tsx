import {Suspense} from "react";
import {OrganizationBreadCrumbs} from "@/app/(authenticated)/organization/[organizationId]/(admin)/_navigation/tabs";
import {Heading} from "@/components/heading";
import {Spinner} from "@/components/spinner";
import InvitationCreateButton from "@/features/invitation/components/invitation-create-button";
import InvitationList from "@/features/invitation/components/invitation-list";


type InvitationsPageProps = {
    params: Promise<{
        organizationId: string;
    }>;
};

const InvitationsPage = async ({params}: InvitationsPageProps) => {
    const { organizationId } = await params;

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <Heading title="Invitations" description="Manage your organizations invitations"
                     tabs={<OrganizationBreadCrumbs />}
                     actions={<InvitationCreateButton organizationId={organizationId}  />}
            />


            <Suspense fallback={<Spinner />}>
                <InvitationList organizationId={organizationId} />
            </Suspense>
        </div>
    );
}

export default InvitationsPage