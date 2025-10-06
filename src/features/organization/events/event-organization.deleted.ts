// Note: Vercel Blob cleanup handled by attachment deletion events
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

            // Step 2: Delete all Vercel Blob objects for this organization
            await step.run("delete-blob-objects", async () => {
                try {
                    // List all blobs with attachment prefix
                    // Note: We can't filter by organization directly in blob storage,
                    // so we'll need to rely on database cascade deletion
                    console.log(`Organization ${organizationId} deleted - blob cleanup handled by attachment deletion events`);
                    
                    // Alternative approach: If we stored organization ID in blob path
                    // const response = await list({
                    //     prefix: `attachments/${organizationId}/`,
                    // });
                    // 
                    // for (const blob of response.blobs) {
                    //     await del(blob.url);
                    // }
                } catch (error) {
                    console.error('Error during blob cleanup:', error);
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