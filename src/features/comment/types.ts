import { Prisma } from "@prisma/client";

// Re-export new types from the types directory
export * from './types';

// Keep existing types for backward compatibility
export type CommentWithMetadata = Prisma.CommentGetPayload<{
    include: {
        user: {
            select: {
                username: true,
                lastName: true,
                firstName: true,
            }
        }
        attachments: true,
    }
}> & {isOwner: boolean};