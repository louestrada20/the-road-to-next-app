import {EventSchemas, Inngest} from 'inngest';
import {EmailChangeEventArgs} from "@/features/account/events/event-email-change";  
import {AttachmentDeletedEventArgs} from "@/features/attachments/events/event-attachment.deleted";
import {EmailVerificationEventArgs} from "@/features/auth/events/event-email-verification";
import {WelcomeEventArgs} from "@/features/auth/events/event-welcome";
import {InvitationCreateEventArgs} from "@/features/invitation/events/event-invitation-created";
import { OrganizationCreateEventArgs } from '@/features/organization/events/event-organization.created';
import {OrganizationDeletedEventArgs} from "@/features/organization/events/event-organization.deleted";
import {PasswordResetEventArgs} from "@/features/password/events/event-password-reset";

export type DeprovisioningScheduledEventArgs = {
    data: {
        organizationId: string;
        queueEntryIds: string[];
    };
};

export type DeprovisioningCanceledEventArgs = {
    data: {
        organizationId: string;
    };
};

type Events = {
    "app/password.password-reset": PasswordResetEventArgs;
    "app/account.welcome": WelcomeEventArgs;
    "app/auth.sign-up": EmailVerificationEventArgs;
    "app/auth.email-verification": EmailVerificationEventArgs;
    "app/invitation.created": InvitationCreateEventArgs;
    "app/attachment.deleted": AttachmentDeletedEventArgs;
    // thumbnail generation now handled by Next.js Image component
    "app/organization.deleted": OrganizationDeletedEventArgs;
    "app/organization.created": OrganizationCreateEventArgs;
    "app/account.email-change": EmailChangeEventArgs;
    "app/deprovisioning.scheduled": DeprovisioningScheduledEventArgs;
    "app/deprovisioning.canceled": DeprovisioningCanceledEventArgs;
};
export const inngest = new Inngest({
    id: "the-road-to-next-pro",
    schemas: new EventSchemas().fromRecord<Events>(),
})