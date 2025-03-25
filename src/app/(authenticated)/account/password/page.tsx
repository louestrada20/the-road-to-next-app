
import {AccountTabs} from "@/app/(authenticated)/account/_navigation/tabs";
import {CardCompact} from "@/components/card-compact";
import {Heading} from "@/components/heading";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {PasswordChangeForm} from "@/features/password/components/password-change-form";



const PasswordPage = async () => {
 await getAuthOrRedirect();
 // don't receive user here to avoid eslint no unused variables, we will change password functionality later anyways
    // this completes the password and profile challenge, user can now update password and profile information
    // but this is very unsecure, we will use emails for password reset or change soon.

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <Heading title="Password" description="Keep your account secure" tabs={
                <AccountTabs />
            }
            />
            <CardCompact className="w-full max-w-[420px] self-center" title="Update Password" description="Keep your password a secret" content={<PasswordChangeForm  />} />

        </div>
    )
}

export default PasswordPage;