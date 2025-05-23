import {serve} from "inngest/next";
import {emailVerificationEvent} from "@/features/auth/events/event-email-verification";
import {signUpFanOut} from "@/features/auth/events/event-signup";
import {welcomeEvent} from "@/features/auth/events/event-welcome";
import {invitationCreatedEvent} from "@/features/invitation/events/email-invitation-created";
import {passwordResetEvent} from "@/features/password/events/event-password-reset";
import {inngest} from "@/lib/inngest";

export const {GET, POST, PUT}  = serve({
    client: inngest,
    functions: [
        passwordResetEvent,
        welcomeEvent,
        signUpFanOut,
        emailVerificationEvent,
        invitationCreatedEvent,
    ],
})