"use server"

import {redirect} from "next/navigation";
import {getAuth} from "@/features/auth/actions/get-auth";
import {deleteSessionCookie} from "@/features/auth/cookie";
import {invalidateSession} from "@/features/auth/session";
import {signInPath} from "@/paths";

export const signOut = async () => {
    const {session} = await getAuth();
     if (!session) {
         redirect(signInPath())
     }

    await invalidateSession(session.id);
    await deleteSessionCookie();

    redirect(signInPath());
}

