"use server"

import {redirect} from "next/navigation";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {hashPassword} from "@/features/auth/password";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import { getClientIp } from "@/lib/get-client-ip";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { limitEmail, limitIp } from "@/lib/rate-limit";
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
    const ip = await getClientIp();

    try {
    const {username, email, password} = signUpSchema.parse(
        Object.fromEntries(formData)
    )

    // ---------- Rate-limit guards ----------
    const resIp = await limitIp(ip, "sign-up", 30, "1 m");
    if (!resIp.success) {
        return toActionState("ERROR", "Too many sign-up attempts from your network. Please try again later.", formData);
    }

    const resEmail = await limitEmail(ip, email, "sign-up");
    if (!resEmail.success) {
        return toActionState("ERROR", "Too many sign-up attempts for this email. Please wait and try again.", formData);
    }
    // ---------- End guards ----------

        const passwordHash = await hashPassword(password)


        // Create the user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
            }
        });

        // Only process invitations that have been accepted (clicked)   
        const invitations = await prisma.invitation.findMany({
            where: {
              email,
              status: "ACCEPTED_WITHOUT_ACCOUNT"
            },
        });

        if (invitations.length > 0) {
          await prisma.$transaction([
            prisma.invitation.deleteMany({
              where: {
                email,
                status: "ACCEPTED_WITHOUT_ACCOUNT"
              },
            }),
            prisma.membership.createMany({
              data: invitations.map((invitation) => ({
                organizationId: invitation.organizationId,
                userId: user.id,
                membershipRole: "MEMBER",
                isActive: false,
              })),
            }),
          ]);
        }

        await inngest.send({name: "app/auth.sign-up",
            data: { userId: user.id}
        })

        const sessionToken = generateRandomSessionToken();
        const session = await createSession(sessionToken, user.id);
        await setSessionCookie(sessionToken, session.expiresAt);

    } catch (error) {
        return fromErrorToActionState(error, formData);
    }

    redirect(ticketsPath())
};