import posthog from 'posthog-js'

/**
 * User properties to identify a user in PostHog
 */
export interface UserProperties {
  email?: string
  organizationId?: string
  [key: string]: unknown
}

/**
 * Identifies a user on the client-side.
 * Uses posthog-js directly (no hook needed when using instrumentation-client.ts).
 * 
 * @param userId - Unique user identifier
 * @param properties - User properties to set
 */
export function identifyUser(userId: string, properties?: UserProperties): void {
  if (typeof window === 'undefined') {
    return // SSR safety
  }

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return // PostHog not configured
  }

  try {
    posthog.identify(userId, properties)
  } catch (error) {
    // Don't break the app if PostHog fails
    if (process.env.NODE_ENV === 'development') {
      console.error('[PostHog] Failed to identify user:', error)
    }
  }
}

