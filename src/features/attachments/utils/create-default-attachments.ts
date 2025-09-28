import { PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { join } from "path";
import { s3 } from "@/lib/aws";
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

// uploads/<attachmentId>/<fileName>
const buildKey = (attachmentId: string, fileName: string) => `uploads/${attachmentId}/${fileName}`;

export const createDefaultAttachments = async (ticketId: string) => {
    const attachments = [];

    for (const attachmentInfo of DEFAULT_ATTACHMENTS) {
        try {
            // Read the file from public directory
            const filePath = join(process.cwd(), "public", "default-attachments", attachmentInfo.name);
            const fileBuffer = readFileSync(filePath);

            // Create attachment row first (temporary s3Key="")
            const attachment = await prisma.attachment.create({
                data: {
                    name: attachmentInfo.name,
                    ticketId,
                    entity: "TICKET",
                    s3Key: "", // placeholder, will update after upload
                }
            });

            const key = buildKey(attachment.id, attachmentInfo.name);

            try {
                // Upload original file
                await s3.send(new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                    Body: fileBuffer,
                    ContentType: attachmentInfo.mimeType
                }));

                // Persist s3Key only if upload succeeded
                await prisma.attachment.update({
                    where: { id: attachment.id },
                    data: { s3Key: key }
                });

                // Lambda will detect upload and generate thumbnail automatically, no Inngest event needed.
                attachments.push(attachment);
                console.log(`Created default attachment: ${attachmentInfo.name}`);
            } catch (s3Error) {
                // If S3 upload fails, clean up the database record
                await prisma.attachment.delete({
                    where: { id: attachment.id }
                });
                console.warn(`Skipped default attachment ${attachmentInfo.name} - S3 upload failed:`, s3Error instanceof Error ? s3Error.message : s3Error);
            }
        } catch (error) {
            console.error(`Error creating default attachment ${attachmentInfo.name}:`, error);
        }
    }

    return attachments;
};