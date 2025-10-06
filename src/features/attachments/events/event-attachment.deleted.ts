import { AttachmentEntity } from "@prisma/client";
import { inngest } from "@/lib/inngest";
import { deleteFileByBlobUrl } from "@/lib/storage";

export type AttachmentDeletedEventArgs = {
    data: {
        attachmentId: string;
        organizationId: string;
        entityId: string;
        entity: AttachmentEntity;
        fileName: string;
        thumbnailUrl?: string;
        blobUrl?: string;
    }
}

export const attachmentDeletedEvent = inngest.createFunction(
{id: "attachment-deleted"},
{event: "app/attachment.deleted"},
    async ({event}) => {
    const { blobUrl } = event.data;
    try {
        // Delete file using blob URL if available
        if (blobUrl) {
            await deleteFileByBlobUrl(blobUrl);
        }
        // Note: With Vercel Blob, we only need to delete the original file
        // Next.js Image handles thumbnail generation on-the-fly
    }
    catch (error) {
        console.log(error);
        return {event, body: false};
    }
    return {event, body: true};
    }
    )