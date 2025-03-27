import {EventSchemas, Inngest} from 'inngest';
import {WelcomeEventArgs} from "@/features/account/events/event-welcome";
import {PasswordResetEventArgs} from "@/features/password/events/event-password-reset";

type Events = {
    "app/password.password-reset": PasswordResetEventArgs;
    "app/account.welcome": WelcomeEventArgs;
}

export const inngest = new Inngest({
    id: "the-road-to-next-pro",
    schemas: new EventSchemas().fromRecord<Events>(),
})