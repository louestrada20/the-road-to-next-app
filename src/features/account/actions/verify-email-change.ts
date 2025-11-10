"use server"
import * as Sentry from "@sentry/nextjs";
import {redirect} from "next/navigation";
import {z} from "zod";
import {setCookieByKey} from "@/actions/cookies";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import { getClientIp } from "@/lib/get-client-ip";
import {prisma} from "@/lib/prisma";
import { limitIp } from "@/lib/rate-limit";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {accountProfilePath} from "@/paths";

const verifyEmailChangeSchema = z.object({
    otp: z.string().length(8)
});

export const verifyEmailChange = async (_actionState: ActionState, formData: FormData) => {
    const {user} = await getAuthOrRedirect();

    try {
        Sentry.addBreadcrumb({
            category: "account.action",
            message: "Verifying email change",
            level: "info",
            data: { userId: user.id },
        });

        const ip = await getClientIp();

        // Rate limiting
        const resIp = await limitIp(ip, "verify-email-change", 20, "1 m");
        if (!resIp.success) {
            return toActionState("ERROR", "Too many verification attempts. Please wait and try again.", formData);
        }

        const {otp} = verifyEmailChangeSchema.parse(Object.fromEntries(formData));

        // Find and validate the email change token
        const emailChangeToken = await prisma.emailChangeToken.findFirst({
            where: {
                userId: user.id,
                code: otp
            }
        });

        if (!emailChangeToken) {
            return toActionState("ERROR", "Invalid verification code", formData);
        }

        // Check if token is expired
        if (Date.now() > emailChangeToken.expiresAt.getTime()) {
            await prisma.emailChangeToken.delete({
                where: {id: emailChangeToken.id}
            });
            return toActionState("ERROR", "Verification code has expired", formData);
        }

        // Check if new email is still available
        const existingUser = await prisma.user.findUnique({
            where: {email: emailChangeToken.newEmail}
        });
        if (existingUser) {
            await prisma.emailChangeToken.delete({
                where: {id: emailChangeToken.id}
            });
            return toActionState("ERROR", "This email is no longer available", formData);
        }

        // Update user email and invalidate all sessions
        await prisma.$transaction([
            prisma.user.update({
                where: {id: user.id},
                data: {
                    email: emailChangeToken.newEmail,
                    emailVerified: true // Mark as verified since they verified the new email
                }
            }),
            prisma.session.deleteMany({
                where: {userId: user.id}
            }),
            prisma.emailChangeToken.delete({
                where: {id: emailChangeToken.id}
            })
        ]);

        // Create new session
        const sessionToken = generateRandomSessionToken();
        const session = await createSession(sessionToken, user.id);
        await setSessionCookie(sessionToken, session.expiresAt);

    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            action: "verify-email-change",
            level: "error",
        });
        return fromErrorToActionState(error, formData);
    }

    await setCookieByKey("toast", "Email successfully changed! You are now signed in.");
    redirect(accountProfilePath());
}
