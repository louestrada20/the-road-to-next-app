"use server"
import {redirect} from "next/navigation";
import {z} from "zod";
import {setCookieByKey} from "@/actions/cookies";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import {validateEmailVerificationCode} from "@/features/auth/utils/validate-email-verification-code";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import { ticketsPath} from "@/paths";

const emailVerificationSchema = z.object({
   otp: z.string().length(8)
});

export const emailVerification = async (_actionState: ActionState, formData: FormData) => {

    const {user} = await getAuthOrRedirect({
        checkEmailVerified: false,
        checkOrganization: false,
        checkActiveOrganization: false,
    });

    try {

        const {otp} = emailVerificationSchema.parse(Object.fromEntries(formData));

        const validCode = await validateEmailVerificationCode(user.id, otp, user.email);

        if (!validCode) {
            return toActionState("ERROR", "Invalid or expired code");
        }



        await prisma.session.deleteMany({
            where: {userId: user.id}
        })

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
            }
        })

        const sessionToken = generateRandomSessionToken();
        const session = await createSession(sessionToken, user.id);
        await setSessionCookie(sessionToken, session.expiresAt);


    } catch (error) {
        // Only capture unexpected errors (DB failures, session issues)
        // Don't capture validation errors or invalid codes
        if (!(error instanceof z.ZodError)) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Don't capture expected validation failures
            if (!errorMessage.includes('Invalid or expired code')) {
                captureSentryError(error, {
                    userId: user.id,
                    action: "email-verification",
                    level: "error",
                    tags: { feature: "auth" },
                });
            }
        }

        return fromErrorToActionState(error, formData)
    }

    await setCookieByKey("toast", "Email Verified!");
    redirect(ticketsPath());
}