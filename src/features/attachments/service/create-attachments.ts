
import {AttachmentEntity} from "@prisma/client";
import { uploadFile } from "@/lib/storage";
import * as attachmentData from "../data";
import * as attachmentSubjectDto from "../dto/attachment-subject-dto";

type CreateAttachmentsArgs = {
    subject: attachmentSubjectDto.Type;
    entity: AttachmentEntity;
    entityId: string;
    files: File[];
}

export const createAttachments = async ({files, entity, entityId, subject}: CreateAttachmentsArgs) => {
    const attachments = [];

    try {
        for (const file of files) {
            // Create database record first
            const attachment = await attachmentData.createAttachment({
                entity,
                entityId,
                name: file.name,
            });

            attachments.push(attachment);

            // Upload file using new abstraction
            const fileMetadata = await uploadFile(file, {
                fileId: attachment.id, // use attachment id
                // thumbnail generation handled by Lambda
                metadata: {
                    attachmentId: attachment.id,
                    entity,
                    entityId,
                },
            });

            // Update attachment with file metadata
            await attachmentData.updateAttachment({
                id: attachment.id,
                s3Key: fileMetadata.s3Key,
                thumbnailKey: fileMetadata.thumbnailKey,
                thumbnailUrl: fileMetadata.thumbnailKey,
            });

            // (Thumbnail event removed – Lambda will pick up S3 upload and create thumbnail automatically)
        }
    } catch (error) {
        throw error;
    }

    return attachments;
}