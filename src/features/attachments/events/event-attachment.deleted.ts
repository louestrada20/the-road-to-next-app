import { AttachmentEntity } from "@prisma/client";
import { inngest } from "@/lib/inngest";
import { captureSentryError } from "@/lib/sentry/capture-error";
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
    async ({event, step}) => {
        const { blobUrl, organizationId, attachmentId } = event.data;

        try {
            await step.run("delete-blob-file", async () => {
                try {
                    // Delete file using blob URL if available
                    if (blobUrl) {
                        await deleteFileByBlobUrl(blobUrl);
                    }
                    // Note: With Vercel Blob, we only need to delete the original file
                    // Next.js Image handles thumbnail generation on-the-fly
                } catch (error) {
                    captureSentryError(error, {
                        organizationId,
                        action: "attachment-deleted-delete-blob",
                        level: "error",
                        tags: { inngest: "attachment-deleted", step: "delete-blob-file", attachmentId },
                    });
                    throw error;
                }
            });

            return {event, body: true};
        } catch (error) {
            console.log(error);
            captureSentryError(error, {
                organizationId,
                action: "attachment-deleted",
                level: "error",
                tags: { inngest: "attachment-deleted", attachmentId },
            });
            return {event, body: false};
        }
    }
)