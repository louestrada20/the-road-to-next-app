import {serve} from "inngest/next";
import {welcomeEvent} from "@/features/account/events/event-welcome";
import {passwordResetEvent} from "@/features/password/events/event-password-reset";
import {inngest} from "@/lib/inngest";

export const {GET, POST, PUT}  = serve({
    client: inngest,
    functions: [
        passwordResetEvent,
        welcomeEvent
    ],
})