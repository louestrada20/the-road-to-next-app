import { Comment, Prisma } from "@prisma/client";

// Include configuration types
export type UserIncludeConfig = { user: { select: { username: true } } };
export type TicketIncludeConfig = { ticket: true };
export type UserAndTicketIncludeConfig = UserIncludeConfig & TicketIncludeConfig;

// Core arguments type
export type CreateCommentArgs = {
  userId: string;
  ticketId: string;
  content: string;
};

// Options type for includes
export type IncludeOptions = {
  includeUser?: boolean;
  includeTicket?: boolean;
  // Easy to extend with more options:
  // includeAttachments?: boolean;
  // includeReactions?: boolean;
  // includeAuthor?: boolean;
};

// Conditional type for return payload
export type CommentPayload<T extends IncludeOptions> = T extends {
  includeUser: true;
  includeTicket: true;
}
  ? Prisma.CommentGetPayload<{ include: UserAndTicketIncludeConfig }>
  : T extends { includeUser: true; includeTicket?: false }
  ? Prisma.CommentGetPayload<{ include: UserIncludeConfig }>
  : T extends { includeTicket: true; includeUser?: false }
  ? Prisma.CommentGetPayload<{ include: TicketIncludeConfig }>
  : T extends { includeUser?: false; includeTicket?: false }
  ? Comment
  : Comment; // fallback for edge cases 
