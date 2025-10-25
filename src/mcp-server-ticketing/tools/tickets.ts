import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { deleteFileByBlobUrl } from '@/lib/storage';
import { toCent } from '@/utils/currency';
import { getAuth } from '../auth';
import { AuthorizationError, NotFoundError, ValidationError } from '../errors';
import { rateLimitMCP } from '../rate-limit';

// Schema for list_tickets
export const listTicketsSchema = z.object({
  page: z.number().int().min(0).default(0),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
  search: z.string().optional(),
});

export const listTickets = async (params: z.infer<typeof listTicketsSchema>) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'list-tickets');
  
  const pageSize = 10; // Default page size for MCP
  const skip = params.page * pageSize;
  
  // Build where clause
  const where: Record<string, unknown> = {
    organizationId: organization.id,
  };
  
  // Add status filter if provided
  if (params.status) {
    where.status = params.status;
  }
  
  // Add search filter if provided
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { content: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  
  // Query tickets with pagination
  const [tickets, count] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        user: { select: { username: true, email: true } },
        attachments: {
          select: {
            id: true,
            name: true,
            blobUrl: true,
            thumbnailUrl: true
          }
        },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.ticket.count({ where })
  ]);
  
  return {
    page: params.page,
    pageSize,
    totalCount: count,
    totalPages: Math.ceil(count / pageSize),
    hasNextPage: count > skip + pageSize,
    hasPreviousPage: params.page > 0,
    tickets: tickets.map(ticket => ({
      ...ticket,
      bounty: ticket.bounty / 100
    }))
  };
};

// Schema for get_ticket
export const getTicketSchema = z.object({
  ticketId: z.string(),
});

export const getTicketById = async (params: z.infer<typeof getTicketSchema>) => {
  const { organization } = getAuth();
  
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    include: {
      user: {
        select: {
          username: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      attachments: {
        select: {
          id: true,
          name: true,
          blobUrl: true,
          thumbnailUrl: true
        }
      },
      _count: { select: { comments: true } }
    }
  });
  
  if (!ticket) {
    throw new NotFoundError('Ticket');
  }
  
  // Security: Verify ticket belongs to organization
  if (ticket.organizationId !== organization.id) {
    throw new AuthorizationError('Ticket belongs to different organization');
  }
  
  return {
    ...ticket,
    bounty: ticket.bounty / 100
  };
};

// Schema for create_ticket
export const createTicketSchema = z.object({
  title: z.string().min(1).max(191),
  content: z.string().min(1).max(1024),
  bounty: z.number().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  userId: z.string().optional(),
});

export const createTicket = async (params: z.infer<typeof createTicketSchema>) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'create-ticket');
  
  // Determine userId - either specified or default to first active member
  let creatorUserId = params.userId;
  
  if (!creatorUserId) {
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
    
    creatorUserId = firstMember.userId;
  } else {
    // Verify userId is a member of the organization
    const membership = await prisma.membership.findUnique({
      where: {
        membershipId: {
          organizationId: organization.id,
          userId: creatorUserId
        }
      }
    });
    
    if (!membership) {
      throw new ValidationError('userId', 'User is not a member of this organization');
    }
  }
  
  // Create ticket
  const ticket = await prisma.ticket.create({
    data: {
      title: params.title,
      content: params.content,
      bounty: toCent(params.bounty),
      deadline: params.deadline,
      userId: creatorUserId,
      organizationId: organization.id,
      status: 'OPEN'
    },
    include: {
      user: {
        select: { 
          username: true, 
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  return {
    ...ticket,
    bounty: ticket.bounty / 100
  };
};

// Schema for update_ticket_status
export const updateTicketStatusSchema = z.object({
  ticketId: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']),
});

export const updateTicketStatus = async (
  params: z.infer<typeof updateTicketStatusSchema>
) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'update-ticket');
  
  // Get ticket and verify ownership
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId }
  });
  
  if (!ticket) {
    throw new NotFoundError('Ticket');
  }
  
  if (ticket.organizationId !== organization.id) {
    throw new AuthorizationError('Ticket belongs to different organization');
  }
  
  // Check if user has update permission
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: organization.id,
      canUpdateTicket: true
    }
  });
  
  if (!membership) {
    throw new AuthorizationError('No members with update permission in organization');
  }
  
  // Update ticket status
  const updatedTicket = await prisma.ticket.update({
    where: { id: params.ticketId },
    data: { status: params.status },
    include: {
      user: {
        select: { username: true, email: true }
      }
    }
  });
  
  return {
    ...updatedTicket,
    bounty: updatedTicket.bounty / 100
  };
};

// Schema for delete_ticket
export const deleteTicketSchema = z.object({
  ticketId: z.string(),
});

export const deleteTicket = async (params: z.infer<typeof deleteTicketSchema>) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'delete-ticket');
  
  // Get ticket with attachments and verify ownership
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    include: { attachments: true }
  });
  
  if (!ticket) {
    throw new NotFoundError('Ticket');
  }
  
  if (ticket.organizationId !== organization.id) {
    throw new AuthorizationError('Ticket belongs to different organization');
  }
  
  // Check delete permission
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: organization.id,
      canDeleteTicket: true
    }
  });
  
  if (!membership) {
    throw new AuthorizationError('No members with delete permission in organization');
  }
  
  // Delete blob files from Vercel Blob storage first
  const deletedBlobs = [];
  for (const attachment of ticket.attachments) {
    if (attachment.blobUrl) {
      try {
        await deleteFileByBlobUrl(attachment.blobUrl);
        deletedBlobs.push(attachment.name);
      } catch (error) {
        console.error(`Failed to delete blob for attachment ${attachment.id}:`, error);
        // Continue with deletion even if blob cleanup fails
      }
    }
  }
  
  // Delete ticket (cascade deletes attachment records)
  await prisma.ticket.delete({
    where: { id: params.ticketId }
  });
  
  return {
    success: true,
    ticketId: params.ticketId,
    message: 'Ticket deleted successfully',
    attachmentsDeleted: ticket.attachments.length,
    blobsDeleted: deletedBlobs.length,
    deletedFiles: deletedBlobs
  };
};

// Schema for search_tickets
export const searchTicketsSchema = z.object({
  query: z.string().min(1),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
  limit: z.number().int().positive().max(100).default(20),
});

export const searchTickets = async (params: z.infer<typeof searchTicketsSchema>) => {
  const { organization, credential } = getAuth();
  
  await rateLimitMCP(organization.id, credential.type, 'search-tickets');
  
  // Full-text search
  const tickets = await prisma.ticket.findMany({
    where: {
      organizationId: organization.id,
      status: params.status,
      OR: [
        { title: { contains: params.query, mode: 'insensitive' } },
        { content: { contains: params.query, mode: 'insensitive' } },
      ]
    },
    take: params.limit,
    include: {
      user: { select: { username: true } },
      attachments: {
        select: {
          id: true,
          name: true,
          blobUrl: true,
          thumbnailUrl: true
        }
      },
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return {
    query: params.query,
    results: tickets.length,
    tickets: tickets.map(ticket => ({
      ...ticket,
      bounty: ticket.bounty / 100
    }))
  };
};

