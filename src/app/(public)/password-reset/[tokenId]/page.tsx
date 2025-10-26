
import {CardCompact} from "@/components/card-compact";
import {PasswordResetForm} from "@/features/password/components/password-reset-form";

type PasswordResetPageProps = {
params: Promise<{
tokenId: string;
}>
};

const PasswordResetPage = async ({params}: PasswordResetPageProps) => {
    const {tokenId}  = await params;
    return (
        <div className="flex flex-col flex-1 justify-center items-center ">
            <CardCompact className="w-full max-w-[420px] animate-fade-in-from-top" title="New Password" description="Enter a new password for your account"
                         content={<PasswordResetForm tokenId={tokenId} />}
            />
        </div>
    )
};

export default PasswordResetPage;

