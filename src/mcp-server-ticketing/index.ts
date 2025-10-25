#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initializeAuth } from './auth';
import { MCPError } from './errors';
import { 
  createComment,
  createCommentSchema,
  listTicketComments,
  listTicketCommentsSchema} from './tools/comments';
import { getOrganizationInfo,getOrganizationInfoSchema } from './tools/organization';
import { 
  createTicket,
  createTicketSchema,
  deleteTicket,
  deleteTicketSchema,
  getTicketById,
  getTicketSchema, 
  listTickets, 
  listTicketsSchema, 
  searchTickets,
  searchTicketsSchema,
  updateTicketStatus,
  updateTicketStatusSchema} from './tools/tickets';

// Check for required environment variable
const MCP_CREDENTIAL_TOKEN = process.env.MCP_CREDENTIAL_TOKEN;

if (!MCP_CREDENTIAL_TOKEN) {
  console.error('[MCP] ERROR: MCP_CREDENTIAL_TOKEN environment variable not set');
  process.exit(1);
}

const server = new Server(
  { name: 'roadtonext-ticketing', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_tickets',
      description: 'List tickets for organization with pagination, filtering, and search',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number (0-indexed)', default: 0 },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'DONE'], description: 'Filter by status' },
          search: { type: 'string', description: 'Search query' },
        },
        required: []
      }
    },
    {
      name: 'get_ticket',
      description: 'Get single ticket by ID with full details',
      inputSchema: {
        type: 'object',
        properties: {
          ticketId: { type: 'string', description: 'Ticket ID' },
        },
        required: ['ticketId']
      }
    },
    {
      name: 'create_ticket',
      description: 'Create a new ticket in the organization',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Ticket title (max 191 chars)' },
          content: { type: 'string', description: 'Ticket description (max 1024 chars)' },
          bounty: { type: 'number', description: 'Bounty amount in dollars' },
          deadline: { type: 'string', description: 'Deadline in YYYY-MM-DD format' },
          userId: { type: 'string', description: 'Optional: User ID of creator' },
        },
        required: ['title', 'content', 'bounty', 'deadline']
      }
    },
    {
      name: 'update_ticket_status',
      description: 'Update the status of a ticket',
      inputSchema: {
        type: 'object',
        properties: {
          ticketId: { type: 'string', description: 'Ticket ID' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'DONE'], description: 'New status' },
        },
        required: ['ticketId', 'status']
      }
    },
    {
      name: 'delete_ticket',
      description: 'Delete a ticket (requires delete permission)',
      inputSchema: {
        type: 'object',
        properties: {
          ticketId: { type: 'string', description: 'Ticket ID to delete' },
        },
        required: ['ticketId']
      }
    },
    {
      name: 'search_tickets',
      description: 'Search tickets by title or content',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'DONE'], description: 'Filter by status' },
          limit: { type: 'number', description: 'Max results (default: 20, max: 100)', default: 20 },
        },
        required: ['query']
      }
    },
    {
      name: 'list_ticket_comments',
      description: 'Get all comments for a ticket',
      inputSchema: {
        type: 'object',
        properties: {
          ticketId: { type: 'string', description: 'Ticket ID' },
        },
        required: ['ticketId']
      }
    },
    {
      name: 'create_comment',
      description: 'Add a comment to a ticket',
      inputSchema: {
        type: 'object',
        properties: {
          ticketId: { type: 'string', description: 'Ticket ID' },
          content: { type: 'string', description: 'Comment content (max 1024 chars)' },
          userId: { type: 'string', description: 'Optional: User ID of commenter' },
        },
        required: ['ticketId', 'content']
      }
    },
    {
      name: 'get_organization_info',
      description: 'Get organization details and statistics',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    let result;
    switch (name) {
      case 'list_tickets':
        result = await listTickets(listTicketsSchema.parse(args));
        break;
      case 'get_ticket':
        result = await getTicketById(getTicketSchema.parse(args));
        break;
      case 'create_ticket':
        result = await createTicket(createTicketSchema.parse(args));
        break;
      case 'update_ticket_status':
        result = await updateTicketStatus(updateTicketStatusSchema.parse(args));
        break;
      case 'delete_ticket':
        result = await deleteTicket(deleteTicketSchema.parse(args));
        break;
      case 'search_tickets':
        result = await searchTickets(searchTicketsSchema.parse(args));
        break;
      case 'list_ticket_comments':
        result = await listTicketComments(listTicketCommentsSchema.parse(args));
        break;
      case 'create_comment':
        result = await createComment(createCommentSchema.parse(args));
        break;
      case 'get_organization_info':
        result = await getOrganizationInfo(getOrganizationInfoSchema.parse(args));
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    if (error instanceof MCPError) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(error.toJSON(), null, 2)
        }],
        isError: true
      };
    }
    
    console.error('Unexpected MCP error:', error);
    return {
      content: [{
        type: 'text',
        text: 'Internal server error'
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  try {
    await initializeAuth(MCP_CREDENTIAL_TOKEN!);
    console.error('[MCP] Authenticated successfully');
  } catch (error) {
    console.error('[MCP] Authentication failed:', error);
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Road to Next Ticketing Server v1.0.0 running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

