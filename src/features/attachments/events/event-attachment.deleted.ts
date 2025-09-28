import { AttachmentEntity } from "@prisma/client";
import { inngest } from "@/lib/inngest";
import { deleteFile } from "@/lib/storage";

export type AttachmentDeletedEventArgs = {
    data: {
        attachmentId: string;
        organizationId: string;
        entityId: string;
        entity: AttachmentEntity;
        fileName: string;
        thumbnailUrl?: string;
    }
}

export const attachmentDeletedEvent = inngest.createFunction(
{id: "attachment-deleted"},
{event: "app/attachment.deleted"},
    async ({event}) => {
    const { attachmentId, fileName } = event.data;
    try {
        // Delete original file using new abstraction
        await deleteFile(attachmentId, fileName);

        // Note: The deleteFile function should handle both original and thumbnail deletion
        // If you need separate handling, you can add a specific function for thumbnail deletion

    }
    catch (error) {
        console.log(error);
        return {event, body: false};
    }
    return {event, body: true};
    }
    )