"use server"
import {redirect} from "next/navigation";
import {z} from "zod";
import {setCookieByKey} from "@/actions/cookies";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {hashPassword} from "@/features/auth/password";
import {prisma} from "@/lib/prisma";
import {signInPath, ticketsPath} from "@/paths";
import {hashToken} from "@/utils/crypto";
import { getClientIp } from "@/lib/get-client-ip";      
import { limitIp, limitEmail } from "@/lib/rate-limit";
import { createSession, generateRandomSessionToken } from "@/features/auth/session";
import { setSessionCookie } from "@/features/auth/cookie";

const passwordResetSchema = z.object({
    password: z.string().min(6).max(191),
    confirmPassword: z.string().min(6).max(191)
}).superRefine(({password, confirmPassword}, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: "custom",
            message: "Passwords don't match",
            path: ["confirmPassword"],
        })
    }
})

export const passwordReset = async (tokenId: string, _actionState: ActionState, formData: FormData) => {
    let sessionCreated = false;
    let toastMessage = "";
    try {
        const ip = await getClientIp();

        // Coarse guard – 30 reset attempts per minute per IP
        const resIp = await limitIp(ip, "password-reset", 30, "1 m");
        if (!resIp.success) {
            return toActionState("ERROR", "Too many password-reset attempts. Please wait and try again.", formData);
        }

        const {password} = passwordResetSchema.parse({
            password: formData.get("password"),
            confirmPassword: formData.get("confirmPassword"),
            });

    const tokenHash = hashToken(tokenId);
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
        where: {
            tokenHash
        },
        include: {
            user: {
                select: {
                    email: true
                }
            }
        }
    })

        if (passwordResetToken) {
            await prisma.passwordResetToken.delete({
                where: {
                    tokenHash
                }
            })
        }


        if (!passwordResetToken || Date.now() > passwordResetToken.expiresAt.getTime()) {
            return toActionState("ERROR", "Expired or invalid verification token", formData);
        }

        // Fine-grained guard – email + IP once we know the account
        if (passwordResetToken.user) {
            const resEmail = await limitEmail(ip, passwordResetToken.user.email, "password-reset");
            if (!resEmail.success) {
                return toActionState("ERROR", "Too many attempts for this account. Please try later.", formData);
            }
        }

        await prisma.session.deleteMany({
            where: {
                userId: passwordResetToken.userId
            }
        })

        const passwordHash = await hashPassword(password);

        await  prisma.user.update({
            where: {
                id: passwordResetToken.userId
            },
            data: {
                passwordHash
            }
        })
        
         // Try to create session
         try {
            const sessionToken = generateRandomSessionToken();
            const session = await createSession(sessionToken, passwordResetToken.userId);
            await setSessionCookie(sessionToken, session.expiresAt);
            sessionCreated = true;
            toastMessage = "Password reset successfully! You are now signed in.";
        } catch (sessionError) {
            sessionCreated = false;
            toastMessage = "Password reset successful, but there was an issue signing you in. Please sign in manually.";
        }


    } catch (error) {
        return fromErrorToActionState(error, formData)
    }

     // Set toast message and redirect - OUTSIDE the try-catch block
     await setCookieByKey("toast", toastMessage);
    
     if (sessionCreated) {
         redirect(ticketsPath()); // Redirect to tickets page (home)
     } else {
         redirect(signInPath()); // Redirect to sign-in page
     }
}