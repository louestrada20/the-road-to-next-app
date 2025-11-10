"use server";

import { Attachment, AttachmentEntity } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {ActionState,fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import { trackAttachmentCreated } from "@/lib/posthog/events/attachments";
import { captureSentryError } from "@/lib/sentry/capture-error";
import { filesSchema } from "../schema/files";
import * as attachmentService from "../service/index"
import { getAttachmentPath } from "../utils/attachment-helper";

 const createAttachmentsSchema = z.object({
        files: filesSchema.refine((files) => files.length !== 0, "File is required"),
});

type CreateAttachmentsArgs = {
    entityId: string;
    entity: AttachmentEntity;
}


export const createAttachments = async ( {entityId, entity}: CreateAttachmentsArgs,
    _actionState: ActionState,
    formData: FormData) => {
    const  {user} = await getAuthOrRedirect();

    Sentry.addBreadcrumb({
        category: "attachment.action",
        message: "Creating attachments",
        level: "info",
        data: { userId: user.id, entityId, entity },
    });

    const subject = await attachmentService.getAttachmentSubject(entity, entityId);


    if (!subject) {
        return toActionState("ERROR", "Subject not found")
    }

    if (!isOwner(user, subject)) {
        return toActionState("ERROR", "Not the owner of the subject");
    }


    let createdAttachments: Attachment[] = [];
    try {
    const { files } = createAttachmentsSchema.parse({
        files: formData.getAll("files"),
    });

   createdAttachments = await attachmentService.createAttachments({files, entity, entityId, subject});

     // Track each attachment creation
     try {
        for (let i = 0; i < createdAttachments.length; i++) {
            const attachment = createdAttachments[i];
            const file = files[i];

            await trackAttachmentCreated(user.id, subject.organizationId, {
                attachmentId: attachment.id,
                entity: entity,
                entityId: entityId,
                ticketId: subject.ticketId,
                commentId: subject.commentId ?? undefined,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });
        }
    } catch (posthogError) {
        if (process.env.NODE_ENV === "development") {
            console.error('[PostHog] Failed to track attachment event:', posthogError);
        }
        captureSentryError(posthogError, {
            userId: user.id,
            organizationId: subject.organizationId,
            action: "track-attachment-created",
            level: "warning",
            tags: { analytics: "posthog" },
        });
    }


    } catch (error) {
        console.error('Create attachments error:', error);
        captureSentryError(error, {
            userId: user.id,
            organizationId: subject.organizationId,
            action: "create-attachments",
            level: "error",
        });
        return fromErrorToActionState(error, formData);
    }

   

   const path = getAttachmentPath(entity, subject);

   if (path) {
    revalidatePath(path);
}

    return toActionState("SUCCESS", "Attachment(s) created");

}