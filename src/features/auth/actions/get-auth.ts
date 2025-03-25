"use server"
import { cookies } from "next/headers";
import {cache} from "react";
import {deleteSessionCookie, SESSION_COOKIE_NAME, setSessionCookie} from "@/features/auth/cookie";
import {validateSession} from "@/features/auth/session";


export const getAuth = cache(async () => {
    const sessionToken =
        (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;

    if (!sessionToken) {
        return {
            user: null,
            session: null,
        }
    }
    const result = await validateSession(sessionToken);
        try {
            if (result.session) {
                if (result.fresh) {
                    await setSessionCookie(sessionToken, result.session.expiresAt);
                }
            }
        if (!result.session) {
            await deleteSessionCookie();
        }
    } catch {
        // Do nothing if used in a RSC
    }

    return result;
})