"use server"
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import { getClientIp } from "@/lib/get-client-ip";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { limitEmail,limitIp } from "@/lib/rate-limit";

const passwordForgotSchema = z.object({
    email: z.string().min(1, {message: "is required"}).max(191).email(),
});

export const passwordForgot = async (_actionState: ActionState, formData: FormData) => {
    try {
        const ip = await getClientIp();

        // Coarse IP guard – 30 forgot requests / minute per IP
        const resIp = await limitIp(ip, "password-forgot", 30, "1 m");
        if (!resIp.success) {
            return toActionState("ERROR", "Too many password-reset requests from your network. Please try again later.", formData);
        }

        const {email} = passwordForgotSchema.parse(Object.fromEntries(formData));

        // Email + IP guard – prevents spamming a single account
        const resEmail = await limitEmail(ip, email, "password-forgot");
        if (!resEmail.success) {
            return toActionState("ERROR", "Too many requests for this account. Please wait.", formData);
        }


        const user = await prisma.user.findUnique({
            where: {email},
        })
        if(!user) {
            return toActionState("ERROR", "Incorrect email", formData)
        }



   await inngest.send({name: "app/password.password-reset",
   data: {userId: user.id}
   })
    } catch (error) {
        return fromErrorToActionState(error, formData)
    }

   return toActionState("SUCCESS", "Check your email for a reset link")
}