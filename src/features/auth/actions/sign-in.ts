"use server"
import {redirect} from "next/navigation";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {verifyPasswordHash} from "@/features/auth/password";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import {prisma} from "@/lib/prisma";
import { ticketsPath} from "@/paths";
import { getClientIp } from "@/lib/get-client-ip";
import { limitIp, limitEmail } from "@/lib/rate-limit";

const signInSchema = z.object({
    email: z.string().min(1, {message: "is required"}).max(191).email(),
    password: z.string().min(6).max(191)
});

export const signIn = async (_actionState: ActionState, formData: FormData) => {
    try {
        const ip = await getClientIp();
        const resIp = await limitIp(ip, "sign-in", 50, "1 m");  // coarse IP guard
        if (!resIp.success) {
            return fromErrorToActionState(new Error("Too many requests"), formData)
        }       

        
        const {email, password} = signInSchema.parse(Object.fromEntries(formData));

        // Fine-grained email + IP guard
        const resEmail = await limitEmail(ip, email, "sign-in");
        if (!resEmail.success) {
            return toActionState("ERROR", "Too many attempts for this account", formData);
        }


        const user = await prisma.user.findUnique({
            where: {email},
        })


        // if(!user) {
        //     return toActionState("ERROR", "Incorrect email or password", formData)
        // }

        const validPassword = await verifyPasswordHash( user ? user.passwordHash : "$argon", password);
        if (!user || !validPassword) {
            return toActionState("ERROR", "Incorrect email or password", formData)
        }
        
        const sessionToken = generateRandomSessionToken();
        const session = await createSession(sessionToken, user.id);
        await setSessionCookie(sessionToken, session.expiresAt);

    } catch (error) {
         return fromErrorToActionState(error, formData)
    }

    redirect(ticketsPath())
}