"use server"


import {revalidatePath} from "next/cache";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { deleteFile, deleteFileByBlobUrl } from "@/lib/storage";
import * as attachmentData from "../data";
import * as attachmentSubjectDTO from "../dto/attachment-subject-dto";
import { getAttachmentPath } from "../utils/attachment-helper";


export const deleteAttachment = async (id: string) => {
    const {user} = await getAuthOrRedirect();

    const attachment = await attachmentData.getAttachment({ 
        id, 
        options: { 
            includeTicket: true, 
            includeComment: true, 
            includeCommentWithTicket: true 
        } 
    });

    const subject = attachmentSubjectDTO.fromAttachment(attachment);

        if (!subject || !attachment) {
            return toActionState("ERROR", "Subject not found");
        }

    if (!isOwner(user, subject)) {
        return toActionState("ERROR", "Not authorized");
    }

    try {
        // Delete blob only when a blob URL exists.
        // For legacy S3 objects, skip remote deletion (no longer supported) and just remove DB record.
        if (attachment.blobUrl) {
            await deleteFileByBlobUrl(attachment.blobUrl);
        }

        // Delete database record
        await prisma.attachment.delete({
            where: {
                id,
            },
        });

        

        await inngest.send({
            name: "app/attachment.deleted",
            data: {
                organizationId: subject.organizationId,
                entityId: subject.entityId,
                entity: attachment.entity,
                fileName: attachment.name,
                attachmentId: attachment.id,
                thumbnailUrl: attachment.thumbnailUrl || undefined,
                blobUrl: attachment.blobUrl || undefined,
            }
        })

    } catch (error) {
        return fromErrorToActionState(error);
    }

    // Revalidate the appropriate path based on entity type
    const path = getAttachmentPath(attachment.entity, subject);

    if (path) {
        revalidatePath(path);
    }

    return toActionState("SUCCESS", "Attachment deleted");
}