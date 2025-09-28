"use server"

import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {generateEmailVerificationCode} from "@/features/auth/utils/generate-email-verification-code";
import {canResendVerificationEmail} from "@/features/auth/utils/can-resend-verification-email";
import {sendEmailVerification} from "@/features/email-verification/send-email-verification";
import { getClientIp } from "@/lib/get-client-ip";
import { limitEmail, limitIp } from "@/lib/rate-limit";

export const emailVerificationResend = async () => {        
    const {user} = await getAuthOrRedirect({
        checkEmailVerified: false,
        checkOrganization: false,
        checkActiveOrganization: false,
    })
    const ip = await getClientIp();
   if (!(await limitIp(ip, "email-verification-resend", 100, "1 m")).success) {
        return fromErrorToActionState(new Error("Too many requests"))
   }    
    if(!(await limitEmail(ip, user.email, "email-verification-resend")).success) {
        return toActionState("ERROR", "Too many requests")
    }

    try {

        const canResend = await canResendVerificationEmail(user.id);

        if (!canResend) {
            return toActionState("ERROR", "You can only resend the verification email every 60 seconds")
        }

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