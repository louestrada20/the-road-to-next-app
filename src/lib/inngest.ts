import {EventSchemas, Inngest} from 'inngest';
import {EmailChangeEventArgs} from "@/features/account/events/event-email-change";  
import {AttachmentDeletedEventArgs} from "@/features/attachments/events/event-attachment.deleted";
import {EmailVerificationEventArgs} from "@/features/auth/events/event-email-verification";
import {WelcomeEventArgs} from "@/features/auth/events/event-welcome";
import {InvitationCreateEventArgs} from "@/features/invitation/events/event-invitation-created";
import { OrganizationCreateEventArgs } from '@/features/organization/events/event-organization.created';
import {OrganizationDeletedEventArgs} from "@/features/organization/events/event-organization.deleted";
import {PasswordResetEventArgs} from "@/features/password/events/event-password-reset";

type Events = {
    "app/password.password-reset": PasswordResetEventArgs;
    "app/account.welcome": WelcomeEventArgs;
    "app/auth.sign-up": EmailVerificationEventArgs;
    "app/auth.email-verification": EmailVerificationEventArgs;
    "app/invitation.created": InvitationCreateEventArgs;
    "app/attachment.deleted": AttachmentDeletedEventArgs;
    // thumbnail-generated event removed – handled by Lambda
    "app/organization.deleted": OrganizationDeletedEventArgs;
    "app/organization.created": OrganizationCreateEventArgs;
    "app/account.email-change": EmailChangeEventArgs;       
};
export const inngest = new Inngest({
    id: "the-road-to-next-pro",
    schemas: new EventSchemas().fromRecord<Events>(),
})