
import {CardCompact} from "@/components/card-compact";
import {EmailVerificationForm} from "@/features/auth/components/email-verification-form";
import {EmailVerificationResendForm} from "@/features/auth/components/email-verification-resend-form";



const EmailVerificationPage = () => {
    return (
        <div className="flex flex-col flex-1 justify-center items-center ">
            <CardCompact className="w-full max-w-[420px] animate-fade-in-from-top" title="Verify Email" description="Please verify your email to continue"
                         content={
                             <div className="flex flex-col gap-y-2">
                <EmailVerificationForm/>
                                 <EmailVerificationResendForm/>
                             </div>
            }
            />
        </div>
    )
};

export default EmailVerificationPage;