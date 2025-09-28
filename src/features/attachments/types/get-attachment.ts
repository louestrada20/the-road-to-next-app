import { Attachment, Prisma } from "@prisma/client";

export type TicketIncludeConfig = { ticket: true };

export type CommentIncludeConfig = { comment: true };

export type CommentWithTicketIncludeConfig = { comment: { include: TicketIncludeConfig } };        


export type GetAttachmentArgs = { 
    id: string;
}

export type IncludeOptions = {
    includeTicket?: boolean;
    includeComment?: boolean;
    includeCommentWithTicket?: boolean;
}

export type AttachmentPayload<T extends IncludeOptions> = T extends {
    includeTicket: true;
}
  ? Prisma.AttachmentGetPayload<{ include: TicketIncludeConfig }>
  : T extends { includeComment: true; includeCommentWithTicket?: false }
  ? Prisma.AttachmentGetPayload<{ include: CommentIncludeConfig }>
  : T extends { includeCommentWithTicket: true }
  ? Prisma.AttachmentGetPayload<{ include: CommentWithTicketIncludeConfig }>
  : Attachment;


