import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuth } from '../auth';
import { AuthorizationError, NotFoundError, ValidationError } from '../errors';
import { rateLimitMCP } from '../rate-limit';

// Schema for list_ticket_comments
export const listTicketCommentsSchema = z.object({
  ticketId: z.string(),
});

export const listTicketComments = async (
  params: z.infer<typeof listTicketCommentsSchema>
) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'list-comments');
  
  // Verify ticket belongs to organization
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    select: { organizationId: true }
  });
  
  if (!ticket) {
    throw new NotFoundError('Ticket');
  }
  
  if (ticket.organizationId !== organization.id) {
    throw new AuthorizationError('Ticket belongs to different organization');
  }
  
  // Get comments
  const comments = await prisma.comment.findMany({
    where: { ticketId: params.ticketId },
    include: {
      user: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  return {
    ticketId: params.ticketId,
    commentCount: comments.length,
    comments
  };
};

// Schema for create_comment
export const createCommentSchema = z.object({
  ticketId: z.string(),
  content: z.string().min(1).max(1024),
  userId: z.string().optional(),
});

export const createComment = async (
  params: z.infer<typeof createCommentSchema>
) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'create-comment');
  
  // Verify ticket belongs to organization
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    select: { organizationId: true }
  });
  
  if (!ticket) {
    throw new NotFoundError('Ticket');
  }
  
  if (ticket.organizationId !== organization.id) {
    throw new AuthorizationError('Ticket belongs to different organization');
  }
  
  // Determine userId
  let commentUserId = params.userId;
  
  if (!commentUserId) {
    const firstMember = await prisma.membership.findFirst({
      where: { 
        organizationId: organization.id,
        isActive: true 
      },
      select: { userId: true }
    });
    
    if (!firstMember) {
      throw new ValidationError('organization', 'No active members in organization');
    }
    
    commentUserId = firstMember.userId;
  } else {
    // Verify userId is member
    const membership = await prisma.membership.findUnique({
      where: {
        membershipId: {
          organizationId: organization.id,
          userId: commentUserId
        }
      }
    });
    
    if (!membership) {
      throw new ValidationError('userId', 'User is not a member of this organization');
    }
  }
  
  // Create comment
  const comment = await prisma.comment.create({
    data: {
      content: params.content,
      userId: commentUserId,
      ticketId: params.ticketId
    },
    include: {
      user: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  return comment;
};

