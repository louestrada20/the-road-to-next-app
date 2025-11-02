import 'server-only'
import { prisma } from '@/lib/prisma'
import { PostHogClient } from './server'
import { PostHogEvents, type StripeEventProperties } from './types'

/**
 * Get admin user (or first user) from an organization for PostHog tracking.
 * Returns user ID and email, or null if organization/memberships not found.
 */
async function getAdminUserFromOrganization(
  organizationId: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: true,
          },
          where: {
            isActive: true,
          },
        },
      },
    })

    if (!organization || organization.memberships.length === 0) {
      return null
    }

    // Prefer ADMIN membership, otherwise use first membership
    const adminMembership =
      organization.memberships.find((m) => m.membershipRole === 'ADMIN') ||
      organization.memberships[0]

    return {
      userId: adminMembership.user.id,
      email: adminMembership.user.email,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[PostHog] Failed to get admin user for organization ${organizationId}:`,
        error
      )
    }
    return null
  }
}

/**
 * Track a Stripe event in PostHog.
 * Non-blocking - errors are logged but don't break the calling flow.
 */
async function trackStripeEvent(
  eventName: string,
  organizationId: string,
  properties: StripeEventProperties,
  userId?: string
): Promise<void> {
  // Don't track if PostHog not configured
  if (!process.env.POSTHOG_API_KEY && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return
  }

  try {
    // Get user info if not provided
    let distinctId: string
    if (userId) {
      distinctId = userId
    } else {
      const userInfo = await getAdminUserFromOrganization(organizationId)
      if (!userInfo) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[PostHog] Could not find user for organization ${organizationId}, skipping event ${eventName}`
          )
        }
        return
      }
      distinctId = userInfo.userId
    }

    const posthog = PostHogClient()

    // Capture event with properties
    posthog.capture({
      distinctId,
      event: eventName,
      properties: {
        ...properties,
        organizationId,
      },
    })

    // Shutdown PostHog client (required for Next.js server functions)
    await posthog.shutdown()
  } catch (error) {
    // Don't break webhook/checkout flow if PostHog fails
    if (process.env.NODE_ENV === 'development') {
      console.error(`[PostHog] Failed to track event ${eventName}:`, error)
    }
  }
}

/**
 * Track checkout session creation event.
 */
export async function trackCheckoutSessionCreated(
  organizationId: string,
  priceId: string,
  additionalProperties?: Partial<StripeEventProperties>
): Promise<void> {
  await trackStripeEvent(
    PostHogEvents.CHECKOUT_SESSION_CREATED,
    organizationId,
    {
      priceId,
      ...additionalProperties,
    }
  )
}

/**
 * Track subscription created event.
 */
export async function trackSubscriptionCreated(
  organizationId: string,
  subscriptionId: string,
  properties?: Partial<StripeEventProperties>
): Promise<void> {
  await trackStripeEvent(PostHogEvents.SUBSCRIPTION_CREATED, organizationId, {
    subscriptionId,
    ...properties,
  })
}

/**
 * Track subscription updated event (e.g., plan change).
 */
export async function trackSubscriptionUpdated(
  organizationId: string,
  subscriptionId: string,
  oldProductId: string | null | undefined,
  newProductId: string | null | undefined,
  properties?: Partial<StripeEventProperties>
): Promise<void> {
  await trackStripeEvent(PostHogEvents.SUBSCRIPTION_UPDATED, organizationId, {
    subscriptionId,
    oldProductId: oldProductId || null,
    newProductId: newProductId || null,
    ...properties,
  })
}

/**
 * Track subscription canceled event.
 */
export async function trackSubscriptionCanceled(
  organizationId: string,
  subscriptionId: string,
  properties?: Partial<StripeEventProperties>
): Promise<void> {
  await trackStripeEvent(PostHogEvents.SUBSCRIPTION_CANCELED, organizationId, {
    subscriptionId,
    ...properties,
  })
}

/**
 * Track payment failed event.
 */
export async function trackPaymentFailed(
  organizationId: string,
  invoiceId: string,
  amount: number,
  properties?: Partial<StripeEventProperties>
): Promise<void> {
  await trackStripeEvent(PostHogEvents.PAYMENT_FAILED, organizationId, {
    invoiceId,
    amount,
    ...properties,
  })
}

