/**
 * Type-safe event names for PostHog tracking
 */
export const PostHogEvents = {
  // Authentication events
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_OUT: 'user_signed_out',

  // Ticket events
  TICKET_CREATED: 'ticket_created',
  TICKET_UPDATED: 'ticket_updated',
  TICKET_VIEWED: 'ticket_viewed',
  TICKET_DELETED: 'ticket_deleted',
  TICKET_STATUS_CHANGED: 'ticket_status_changed',

  // Comment events
  COMMENT_CREATED: 'comment_created',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',

  // Organization events
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_DELETED: 'organization_deleted',
  MEMBERSHIP_CREATED: 'membership_created',
  MEMBERSHIP_DELETED: 'membership_deleted',
  MEMBERSHIP_ROLE_UPDATED: 'membership_role_updated',
  ORGANIZATION_SWITCHED: 'organization_switched',
  PERMISSION_CHANGED: 'permission_changed',

  // Attachment events
  ATTACHMENT_CREATED: 'attachment_created',
  ATTACHMENT_DELETED: 'attachment_deleted',

  // Stripe events
  CHECKOUT_SESSION_CREATED: 'checkout_session_created',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  PAYMENT_FAILED: 'payment_failed',
} as const

export type PostHogEventName = (typeof PostHogEvents)[keyof typeof PostHogEvents]

/**
 * Properties for authentication events
 */
export interface AuthEventProperties {
  method?: string
  email?: string
}



/**
 * Properties for ticket events
 */
export interface TicketEventProperties {
  ticketId?: string
  organizationId?: string
  hasBounty?: boolean
  hasDeadline?: boolean
  status?: string
}

/**
 * Properties for comment events
 */
export interface CommentEventProperties {
  commentId?: string
  ticketId?: string
  organizationId?: string
  contentLength?: number
  hasAttachments?: boolean
  attachmentCount?: number
}



/**
 * Properties for attachment events
 */
export interface AttachmentEventProperties {
  attachmentId?: string
  entity?: 'TICKET' | 'COMMENT'
  entityId?: string
  ticketId?: string        // Always present (direct for tickets, via comment for comments)
  commentId?: string 
  organizationId?: string
  fileName?: string
  fileSize?: number
  fileType?: string
}
/**
 * Properties for organization events
 */
export interface OrganizationEventProperties {
  organizationId?: string
  userId?: string           // For membership events (target user)
  invitedUserId?: string    // For membership_created (who joined)
  removedUserId?: string    // For membership_deleted (who left)
  membershipRole?: string   // For role updates (MEMBER/ADMIN)
  oldRole?: string          // For role updates (previous role)
  newRole?: string          // For role updates (new role)
  permissionKey?: string    // For permission changes
  permissionValue?: boolean // For permission changes (true/false)
  organizationName?: string // For organization_deleted (org is deleted)
}

/**
 * Properties for Stripe events
 */
export interface StripeEventProperties {
  organizationId?: string
  customerId?: string
  subscriptionId?: string
  productId?: string
  priceId?: string
  amount?: number
  currency?: string
  status?: string
  oldProductId?: string | null
  newProductId?: string | null
  sessionId?: string
  invoiceId?: string
  attemptCount?: number
}

