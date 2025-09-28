import { prisma } from "@/lib/prisma";
import { AttachmentPayload,GetAttachmentArgs, IncludeOptions } from "../types/get-attachment";    

export async function getAttachment<T extends IncludeOptions>({id, options}: GetAttachmentArgs & { options?: T }): Promise<AttachmentPayload<T>> {
    const includeTicket = options?.includeTicket === true ? {
        ticket: true,
    } : undefined;

    const includeComment = options?.includeComment === true ? {
        comment: true,
    } : undefined;

    const includeCommentWithTicket = options?.includeCommentWithTicket === true ? {
        comment: {
            include: {
                ticket: true,
            },
        },
    } : undefined;

    const attachment = await prisma.attachment.findUniqueOrThrow({
        where: { id },
        include: {
            ...(includeTicket || {}),
            ...(includeComment || {}),
            ...(includeCommentWithTicket || {}),
        },
    })

    // Validate that requested includes match the attachment's entity type
    if (options?.includeTicket === true && attachment.entity === 'TICKET' && !attachment.ticket) {
        throw new Error("Ticket data was requested but not returned");
    }

    if (options?.includeComment === true && attachment.entity === 'COMMENT' && !attachment.comment) {
        throw new Error("Comment data was requested but not returned");
    }

    if (options?.includeCommentWithTicket === true && attachment.entity === 'COMMENT' && !attachment.comment?.ticketId) {
        throw new Error("Comment with ticket data was requested but not returned");
    }

    return attachment as unknown as AttachmentPayload<T>;      
}   