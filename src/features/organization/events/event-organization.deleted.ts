import { DeleteObjectsCommand,ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";

export type OrganizationDeletedEventArgs = {
    data: {
        organizationId: string;
        organizationName: string;
    }
}

export const organizationDeletedEvent = inngest.createFunction(
    { id: "organization-deleted" },
    { event: "app/organization.deleted" },
    async ({ event, step }) => {
        const { organizationId, organizationName } = event.data;
        
        try {
            console.log(`Starting cleanup for organization: ${organizationName} (${organizationId})`);
            
            // Step 1: Get all attachments for this organization
            const attachments = await step.run("get-organization-attachments", async () => {
                return await prisma.attachment.findMany({
                    where: {
                        ticket: {
                            organizationId: organizationId
                        }
                    },
                    include: {
                        ticket: true
                    }
                });
            });

            console.log(`Found ${attachments.length} attachments to clean up`);

            // Step 2: Delete all S3 objects for this organization
            await step.run("delete-s3-objects", async () => {
                const objectsToDelete: { Key: string }[] = [];
                
                // List all objects with the organization prefix
                let continuationToken: string | undefined;
                
                do {
                    const listResponse = await s3.send(new ListObjectsV2Command({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Prefix: `${organizationId}/`,
                        ContinuationToken: continuationToken,
                    }));

                    if (listResponse.Contents) {
                        objectsToDelete.push(...listResponse.Contents.map(obj => ({ Key: obj.Key! })));
                    }

                    continuationToken = listResponse.NextContinuationToken;
                } while (continuationToken);

                console.log(`Found ${objectsToDelete.length} S3 objects to delete`);

                // Delete objects in batches of 1000 (S3 limit)
                const batchSize = 1000;
                for (let i = 0; i < objectsToDelete.length; i += batchSize) {
                    const batch = objectsToDelete.slice(i, i + batchSize);
                    
                    if (batch.length > 0) {
                        await s3.send(new DeleteObjectsCommand({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Delete: {
                                Objects: batch,
                                Quiet: false
                            }
                        }));
                        
                        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} objects)`);
                    }
                }
            });

            console.log(`Successfully cleaned up S3 objects for organization: ${organizationName}`);
            return { event, body: { success: true, attachmentsDeleted: attachments.length } };
            
        } catch (error) {
            console.error(`Failed to clean up organization ${organizationId}:`, error);
            throw error;
        }
    }
); 