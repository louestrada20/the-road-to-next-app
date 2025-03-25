"use server"
import {redirect} from "next/navigation";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {verifyPasswordHash} from "@/features/auth/password";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import {prisma} from "@/lib/prisma";
import { ticketsPath} from "@/paths";

const signInSchema = z.object({
    email: z.string().min(1, {message: "is required"}).max(191).email(),
    password: z.string().min(6).max(191)
});

export const signIn = async (_actionState: ActionState, formData: FormData) => {
    try {
        const {email, password} = signInSchema.parse(Object.fromEntries(formData));


        const user = await prisma.user.findUnique({
            where: {email},
        })
        if(!user) {
            return toActionState("ERROR", "Incorrect email or password", formData)
        }

        const validPassword = await verifyPasswordHash(user.passwordHash, password);
        if (!validPassword) {
            return toActionState("ERROR", "Incorrect email or password", formData)
        }


        const sessionToken = generateRandomSessionToken();
        const session = await createSession(sessionToken, user.id);
        await setSessionCookie(sessionToken, session.expiresAt);
        // old way with lucia.
        // const session = await lucia.createSession(user.id, {});
        // const sessionCookie = lucia.createSessionCookie(session.id);
        // const cookiesResult =  await cookies();
        // cookiesResult.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    } catch (error) {
         return fromErrorToActionState(error, formData)
    }

    redirect(ticketsPath())
}