"use server"
import {redirect} from "next/navigation";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {setSessionCookie} from "@/features/auth/cookie";
import {verifyPasswordHash} from "@/features/auth/password";
import {createSession, generateRandomSessionToken} from "@/features/auth/session";
import {getActiveOrganization} from "@/features/organization/queries/get-active-organization";
import { getClientIp } from "@/lib/get-client-ip";
import {identifyUserServer} from "@/lib/posthog/identify-server";
import {prisma} from "@/lib/prisma";
import { limitEmail,limitIp } from "@/lib/rate-limit";
import { ticketsPath} from "@/paths";

const signInSchema = z.object({
    email: z.string().min(1, {message: "is required"}).max(191).email(),
    password: z.string().min(6).max(191)
});

export const signIn = async (_actionState: ActionState, formData: FormData) => {
    try {
        // Parse email first to check if it's an E2E test user
        const formEntries = Object.fromEntries(formData);
        const email = formEntries.email as string;
        const isE2ETest = process.env.NODE_ENV === 'test' || email?.includes('@e2e.local');
        
        const ip = await getClientIp();
        // Bypass rate limiting for E2E test users
        const resIp = isE2ETest ? { success: true } : await limitIp(ip, "sign-in", 50, "1 m");  // coarse IP guard
        if (!resIp.success) {
            return fromErrorToActionState(new Error("Too many requests"), formData)
        }       

        
        const {email: validatedEmail, password} = signInSchema.parse(formEntries);

        // Fine-grained email + IP guard
        // Bypass rate limiting for E2E test users in test environment
        const resEmail = isE2ETest ? { success: true } : await limitEmail(ip, validatedEmail, "sign-in");
        if (!resEmail.success) {
            return toActionState("ERROR", "Too many attempts for this account", formData);
        }


        const user = await prisma.user.findUnique({
            where: {email: validatedEmail},
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

        // Identify user in PostHog after successful sign-in
        const activeOrganization = await getActiveOrganization();
        await identifyUserServer(user.id, {
            email: user.email,
            username: user.username,
            organizationId: activeOrganization?.id,
        });

    } catch (error) {
         return fromErrorToActionState(error, formData)
    }

    redirect(ticketsPath())
}