"use server"
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {verifyPasswordHash} from "@/features/auth/password";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";
import { limitIp, limitEmail } from "@/lib/rate-limit";


const passwordChangeSchema = z.object({
    password: z.string().min(6).max(191),
});

export const passwordChange = async (_actionState: ActionState, formData: FormData) => {

    try {
        const auth = await getAuthOrRedirect();

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

        await inngest.send({name: "app/password.password-reset",
            data: {userId: user.id}
        })

    } catch (error) {
        return fromErrorToActionState(error, formData)
    }
    return toActionState("SUCCESS", "Check your email for a reset link")
}