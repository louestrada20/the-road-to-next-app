
import {serve} from "inngest/next";
import {emailChangeEvent} from "@/features/account/events/event-email-change";
import {attachmentDeletedEvent} from "@/features/attachments/events/event-attachment.deleted";
import {emailVerificationEvent} from "@/features/auth/events/event-email-verification";
import {signUpFanOut} from "@/features/auth/events/event-signup";
import {welcomeEvent} from "@/features/auth/events/event-welcome";
import {deprovisioningWorkflow} from "@/features/deprovisioning/events/event-deprovisioning-workflow";
import {invitationCreatedEvent} from "@/features/invitation/events/event-invitation-created";
import { organizationCreatedEvent } from "@/features/organization/events/event-organization.created";
import {organizationDeletedEvent} from "@/features/organization/events/event-organization.deleted";
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
        attachmentDeletedEvent,
        organizationDeletedEvent,
        organizationCreatedEvent,
        emailChangeEvent,
        deprovisioningWorkflow,
    ],
})
