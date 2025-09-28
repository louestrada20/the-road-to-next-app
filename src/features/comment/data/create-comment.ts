import { prisma } from "@/lib/prisma";
import { 
  CreateCommentArgs, 
  IncludeOptions, 
  CommentPayload 
} from "../types/create-comment";

export async function createComment<T extends IncludeOptions>({
  userId,
  ticketId,
  content,
  options,
}: CreateCommentArgs & { options?: T }): Promise<CommentPayload<T>> {
  const includeUser = options?.includeUser === true ? {
    user: {
      select: {
        username: true,
      },
    },
  } : undefined;

  const includeTicket = options?.includeTicket === true ? {
    ticket: true,
  } : undefined;

  const comment = await prisma.comment.create({
    data: {
      userId,
      ticketId,
      content,
    },
    include: {
      ...(includeUser || {}),
      ...(includeTicket || {}),
    },
  });

  // Optional runtime validation
  if (options?.includeUser === true && !comment.user) {
    throw new Error('User data was requested but not returned');
  }

  if (options?.includeTicket === true && !comment.ticket) {
    throw new Error('Ticket data was requested but not returned');
  }

  return comment as CommentPayload<T>;
}