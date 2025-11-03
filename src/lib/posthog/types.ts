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

  // Organization events
  ORGANIZATION_CREATED: 'organization_created',
  MEMBERSHIP_CREATED: 'membership_created',
  MEMBERSHIP_UPDATED: 'membership_updated',
  PERMISSION_CHANGED: 'permission_changed',

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
 * Properties for organization events
 */
export interface OrganizationEventProperties {
  organizationId?: string
  userId?: string
  permissionKey?: string
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

