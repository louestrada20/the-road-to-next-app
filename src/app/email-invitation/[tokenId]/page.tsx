import {CardCompact} from "@/components/card-compact";
import {getOrganizationByInvitation} from "@/features/invitation/actions/get-organization-by-invitation";
import {InvitationAcceptForm} from "@/features/invitation/components/invitation-accept-form";


type EmailInvitationPageProps = {
    params: Promise<{
        tokenId: string;
    }>;
};


const EmailInvitationPage = async ({params}: EmailInvitationPageProps) => {
    const {tokenId} = await params;
    const organizationName = await getOrganizationByInvitation(tokenId);

   return (
        <div className="flex-1 flex flex-col justify-center items-center">
            {organizationName ? (
                <CardCompact
                    title="Invitation to Organization"
                    description={`Accept invitation to join ${organizationName}`}
                    className=" w-full max-w-[420px] animate-fade-in-from-top"
                    content={< InvitationAcceptForm tokenId={tokenId} />}
                />
            ) : (
                <CardCompact
                title="Error, Invitation not found"
                className=" w-full max-w-[420px] animate-fade-in-from-top"
                description={`Invitation not found`}
                content={null}
                />
            )
            }


        </div>
    )
}

export default EmailInvitationPage;

