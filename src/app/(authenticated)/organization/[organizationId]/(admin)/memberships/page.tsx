
import {Suspense} from "react";
import {OrganizationBreadCrumbs} from "@/app/(authenticated)/organization/[organizationId]/(admin)/_navigation/tabs";
import {Heading} from "@/components/heading";
import {Spinner} from "@/components/spinner";
import InvitationCreateButton from "@/features/invitation/components/invitation-create-button";
import {MembershipList} from "@/features/memberships/components/membership-list";

type MembershipsPageProps = {
    params: Promise <{
        organizationId: string;
    }>
};

const MembershipsPage = async ({params}: MembershipsPageProps) => {
    const {organizationId} = await params;
    return (
        <div className="flex flex-1 flex-col gap-y-8">
            <Heading title="Memberships"
                     description="Membership by organization"
                     tabs={<OrganizationBreadCrumbs />}
                     actions={<InvitationCreateButton organizationId={organizationId}  />}
            />
            <Suspense fallback={<Spinner />} >
                <MembershipList organizationId={organizationId} />
            </Suspense>
        </div>
    )
}

export default MembershipsPage;

