import {AttachmentEntity} from "@prisma/client"
import {AttachmentSubject, isComment, isTicket} from "../types"


export type Type = { 
    entityId: string;
    entity: AttachmentEntity;
    organizationId: string;
    userId: string | null;
    ticketId: string;
    commentId: string | null;
}


export const fromTicket = (ticket: AttachmentSubject | null) => {
    if (!ticket || !isTicket(ticket)) {
        return null;
    };

    return {
        entity: "TICKET" as AttachmentEntity,
        entityId: ticket.id,
        organizationId: ticket.organizationId,
        userId: ticket.userId,
        ticketId: ticket.id,
        commentId: null,
    }
};

export const fromComment = (comment: AttachmentSubject | null) => {
    if (!comment || !isComment(comment)) {
        return null;
    }

    return {
        entity: "COMMENT" as AttachmentEntity,
        entityId: comment.id,
        organizationId: comment.ticket.organizationId,
        userId: comment.userId,
        ticketId: comment.ticket.id,
        commentId: comment.id,
    }
}

// Helper function to get attachment subject from attachment data with includes
export const fromAttachment = (attachment: Record<string, unknown>): Type | null => {
    if (attachment.entity === 'TICKET' && attachment.ticket) {
        return fromTicket(attachment.ticket as AttachmentSubject);
    } else if (attachment.entity === 'COMMENT' && attachment.comment) {
        return fromComment(attachment.comment as AttachmentSubject);
    }
    return null;
}