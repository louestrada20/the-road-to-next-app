"use server"

import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {generateEmailVerificationCode} from "@/features/auth/utils/generate-email-verification-code";
import {sendEmailVerification} from "@/features/email-verification/send-email-verification";

export const emailVerificationResend = async () => {
    const {user} = await getAuthOrRedirect({
        checkEmailVerified: false,
        checkOrganization: false,
        checkActiveOrganization: false,
    })
    try {
        const verificationCode = await generateEmailVerificationCode(user.id, user.email);

        const result = await sendEmailVerification(user.username, user.email, verificationCode);

        if (result.error) {
           return toActionState("ERROR", "Failed to send verification email")
        }

    } catch (error) {

        return fromErrorToActionState(error)
    }


    return toActionState("SUCCESS", "Verification email has been sent")
}