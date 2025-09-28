


"use server"
import { redirect } from "next/navigation";
import {z} from "zod";
import { setCookieByKey } from "@/actions/cookies";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import { getClientIp } from "@/lib/get-client-ip";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { limitEmail,limitIp } from "@/lib/rate-limit";
import { emailChangeVerifyPath } from "@/paths";

const changeEmailSchema = z.object({
    newEmail: z.string().min(1, {message: "is required"}).max(191).email(),
});

export const changeEmail = async (_actionState: ActionState, formData: FormData) => {
    try {
        const {user} = await getAuthOrRedirect();
        const ip = await getClientIp();

        // Rate limiting
        const resIp = await limitIp(ip, "change-email", 10, "1 m");
        if (!resIp.success) {
            return toActionState("ERROR", "Too many email change requests. Please wait and try again.", formData);
        }

        const {newEmail} = changeEmailSchema.parse(Object.fromEntries(formData));

        // Check if new email is different from current
        if (newEmail === user.email) {
            return toActionState("ERROR", "New email must be different from your current email", formData);
        }

        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
            where: {email: newEmail}
        });
        if (existingUser) {
            return toActionState("ERROR", "This email is already in use", formData);
        }

        // Fine-grained rate limiting for the new email
        const resNewEmail = await limitEmail(ip, newEmail, "change-email");
        if (!resNewEmail.success) {
            return toActionState("ERROR", "Too many requests for this email. Please wait.", formData);
        }

        // Delete any existing email change tokens for this user
        await prisma.emailChangeToken.deleteMany({
            where: {userId: user.id}
        });

        // Trigger email change event
        await inngest.send({
            name: "app/account.email-change",
            data: {
                userId: user.id,
                currentEmail: user.email,
                newEmail: newEmail,
                username: user.username
            }
        });


    } catch (error) {
        return fromErrorToActionState(error, formData);
    }

        await setCookieByKey("toast", "Verification email sent to your new email address"); 

    redirect(emailChangeVerifyPath());
}