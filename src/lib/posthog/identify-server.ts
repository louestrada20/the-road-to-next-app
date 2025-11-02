import 'server-only'
import { PostHogClient } from './server'

/**
 * User properties to identify a user in PostHog
 */
export interface UserProperties {
  email?: string
  organizationId?: string
  [key: string]: unknown
}

/**
 * Identifies a user on the server-side.
 * Uses PostHogClient pattern with shutdown.
 * 
 * @param userId - Unique user identifier
 * @param properties - User properties to set
 */
export async function identifyUserServer(
  userId: string,
  properties?: UserProperties
): Promise<void> {
  const posthog = PostHogClient()

  try {
    posthog.identify({
      distinctId: userId,
      properties,
    })
  } catch (error) {
    // Don't break the app if PostHog fails
    if (process.env.NODE_ENV === 'development') {
      console.error('[PostHog] Failed to identify user:', error)
    }
  } finally {
    await posthog.shutdown()
  }
}

