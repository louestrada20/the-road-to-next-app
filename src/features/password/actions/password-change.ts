"use server"
import * as Sentry from "@sentry/nextjs";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {verifyPasswordHash} from "@/features/auth/password";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import { getClientIp } from "@/lib/get-client-ip";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { limitEmail,limitIp } from "@/lib/rate-limit";
import { captureSentryError } from "@/lib/sentry/capture-error";


const passwordChangeSchema = z.object({
    password: z.string().min(6).max(191),
});

export const passwordChange = async (_actionState: ActionState, formData: FormData) => {
    const auth = await getAuthOrRedirect();

    try {
        Sentry.addBreadcrumb({
            category: "password.action",
            message: "Password change request",
            level: "info",
            data: { userId: auth.user.id },
        });

        // ------- Rate-limit guards -------
        const ip = await getClientIp();

        const resIp = await limitIp(ip, "password-change", 60, "1 m");
        if (!resIp.success) {
            return toActionState("ERROR", "Too many password-change attempts. Please wait and try again.", formData);
        }

        const resEmail = await limitEmail(ip, auth.user.email, "password-change");
        if (!resEmail.success) {
            return toActionState("ERROR", "Too many password-change attempts. Please wait and try again.", formData);
        }
        // ------- End guards -------
        
        const {password} = passwordChangeSchema.parse({
            password: formData.get("password"),
        });

        const user = await prisma.user.findUnique({
            where: {email: auth.user.email}
        })
        if (!user) {
            return toActionState("ERROR", "Invalid request", formData);
        }

        const validPassword = await verifyPasswordHash(auth.user.passwordHash, password)
        if (!validPassword) {
            return toActionState("ERROR", "Incorrect password", formData)
        }

        try {
            await inngest.send({name: "app/password.password-reset",
                data: {userId: user.id}
            })
        } catch (inngestError) {
            captureSentryError(inngestError, {
                userId: user.id,
                action: "password-change-send-email",
                level: "warning",
            });
        }

    } catch (error) {
        captureSentryError(error, {
            userId: auth.user.id,
            action: "password-change",
            level: "error",
        });
        return fromErrorToActionState(error, formData)
    }
    return toActionState("SUCCESS", "Check your email for a reset link")
}