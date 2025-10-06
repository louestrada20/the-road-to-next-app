import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";

const DEFAULT_ATTACHMENTS = [
    {
        name: "sample-image-1.jpg",
        mimeType: "image/jpeg",
    },
    {
        name: "sample-image-2.png", 
        mimeType: "image/png",
    },
];

// attachments/<attachmentId>/<fileName>
const buildBlobPath = (attachmentId: string, fileName: string) => `attachments/${attachmentId}/${fileName}`;

export const createDefaultAttachments = async (ticketId: string) => {
    const attachments = [];

    for (const attachmentInfo of DEFAULT_ATTACHMENTS) {
        try {
            // Read the file from public directory
            const filePath = join(process.cwd(), "public", "default-attachments", attachmentInfo.name);
            const fileBuffer = readFileSync(filePath);

            // Create attachment row first
            const attachment = await prisma.attachment.create({
                data: {
                    name: attachmentInfo.name,
                    ticketId,
                    entity: "TICKET",
                    blobUrl: "", // placeholder, will update after upload
                    blobPath: "", // placeholder, will update after upload
                }
            });

            const blobPath = buildBlobPath(attachment.id, attachmentInfo.name);

            try {
                // Upload to Vercel Blob
                const blob = await put(blobPath, fileBuffer, {
                    access: 'public',
                    addRandomSuffix: false,
                    contentType: attachmentInfo.mimeType,
                });

                // Update attachment with blob URL and path
                await prisma.attachment.update({
                    where: { id: attachment.id },
                    data: { 
                        blobUrl: blob.url,
                        blobPath: blobPath
                    }
                });

                attachments.push(attachment);
                console.log(`Created default attachment: ${attachmentInfo.name} at ${blob.url}`);
            } catch (blobError) {
                // If Blob upload fails, clean up the database record
                await prisma.attachment.delete({
                    where: { id: attachment.id }
                });
                console.warn(`Skipped default attachment ${attachmentInfo.name} - Blob upload failed:`, blobError instanceof Error ? blobError.message : blobError);
            }
        } catch (error) {
            console.error(`Error creating default attachment ${attachmentInfo.name}:`, error);
        }
    }

    return attachments;
};