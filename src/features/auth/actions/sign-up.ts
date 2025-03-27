"use server"

import {redirect} from "next/navigation";
import {z} from "zod";
import {ActionState, fromErrorToActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {hashPassword} from "@/features/auth/password";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import {ticketsPath} from "@/paths";

const signUpSchema = z.object({
    username: z.string().min(1).max(191).refine((value) => !value.includes(" "), "Username cannot use spaces."),
    email: z.string().min(1, {message: "Is required"}).max(191).email(),
    password: z.string().min(6).max(191),
    confirmPassword: z.string().min(6).max(191)
})
    .superRefine(({password, confirmPassword}, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: "custom",
            message: "Passwords don't match",
            path: ["confirmPassword"],
        })
    }
})


export const signUp = async (_actionState: ActionState, formData: FormData) => {
    try {
    const {username, email, password} = signUpSchema.parse(
        Object.fromEntries(formData)
    )

        const passwordHash = await hashPassword(password)


        const user = await prisma.user.create({
            data: {
                username,
                email,
            passwordHash,
            }
        });
        await inngest.send({name: "app/account.welcome",
            data: {userId: user.id}
        })

        const sessionToken = generateRandomSessionToken();
        const session = await createSession(sessionToken, user.id);
        await setSessionCookie(sessionToken, session.expiresAt);


    } catch (error) {
        return fromErrorToActionState(error, formData);
    }

    redirect(ticketsPath())
};