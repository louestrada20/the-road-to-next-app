import { prisma } from "@/lib/prisma";

type UpdateAttachmentArgs = {
    id: string;
    s3Key?: string;
    thumbnailKey?: string;
    thumbnailUrl?: string;
    blobUrl?: string;
    blobPath?: string;
};

export const updateAttachment = async ({ id, s3Key, thumbnailKey, thumbnailUrl, blobUrl, blobPath }: UpdateAttachmentArgs) => {
    return await prisma.attachment.update({
        where: { id },
        data: {
            ...(s3Key && { s3Key }),
            ...(thumbnailKey && { thumbnailKey }),
            ...(thumbnailUrl && { thumbnailUrl }),
            ...(blobUrl && { blobUrl }),
            ...(blobPath && { blobPath }),
        },
    });
}; 