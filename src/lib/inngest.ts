import {EventSchemas, Inngest} from 'inngest';
import {EmailVerificationEventArgs} from "@/features/auth/events/event-email-verification";
import {WelcomeEventArgs} from "@/features/auth/events/event-welcome";
import {InvitationCreateEventArgs} from "@/features/invitation/events/email-invitation-created";
import {PasswordResetEventArgs} from "@/features/password/events/event-password-reset";

type Events = {
    "app/password.password-reset": PasswordResetEventArgs;
    "app/account.welcome": WelcomeEventArgs;
    "app/auth.sign-up": EmailVerificationEventArgs;
    "app/auth.email-verification": EmailVerificationEventArgs;
    "app/invitation.created": InvitationCreateEventArgs;
};
export const inngest = new Inngest({
    id: "the-road-to-next-pro",
    schemas: new EventSchemas().fromRecord<Events>(),
})