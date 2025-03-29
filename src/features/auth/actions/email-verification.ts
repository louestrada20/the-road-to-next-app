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
import { ticketsPath} from "@/paths";

const emailVerificationSchema = z.object({
   otp: z.string().length(8)
});

export const emailVerification = async (_actionState: ActionState, formData: FormData) => {

    const {user} = await getAuthOrRedirect({
        checkEmailVerified: false
    });

    try {

        const {otp} = emailVerificationSchema.parse(Object.fromEntries(formData));

        const validCode = await validateEmailVerificationCode(user.id, otp, user.email);

        if (!validCode) {
            return toActionState("ERROR", "Invalid or expired code");
        }


        // TODO - Implement email verification logic

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

        return fromErrorToActionState(error, formData)
    }

    await setCookieByKey("toast", "Email Verified!");
    redirect(ticketsPath());
}