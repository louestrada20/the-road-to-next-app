
import {Suspense} from "react";
import {OrganizationBreadcrumbs} from "@/app/(authenticated)/organization/[organizationId]/(admin)/_navigation/tabs";
import {Heading} from "@/components/heading";
import {Spinner} from "@/components/spinner";
import InvitationCreateButton from "@/features/invitation/components/invitation-create-button";
import {MembershipList} from "@/features/memberships/components/membership-list";
import {OrganizationRenameButton} from "@/features/organization/components/organization-rename-button";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {prisma} from "@/lib/prisma";

type MembershipsPageProps = {
    params: Promise <{
        organizationId: string;
    }>
};

const MembershipsPage = async ({params}: MembershipsPageProps) => {
    const {organizationId} = await params;
    
    // Get current user
    const {user} = await getAuthOrRedirect();
    
    // Get organization for rename button
    const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
    });

    if (!organization) {
        throw new Error("Organization not found");
    }

    return (
        <div className="flex flex-1 flex-col gap-y-8">
            <Heading title="Memberships"
                     description="Membership by organization"
                     tabs={<OrganizationBreadcrumbs />}
                     actions={
                         <div className="flex gap-x-2">
                             <OrganizationRenameButton organization={organization} />
                             <InvitationCreateButton organizationId={organizationId} />
                         </div>
                     }
            />
            <Suspense fallback={<Spinner />} >
                <MembershipList organizationId={organizationId} currentUserId={user.id} />
            </Suspense>
        </div>
    )
}

export default MembershipsPage;

