import 'server-only'
import { PostHog } from 'posthog-node'

/**
 * Creates a new PostHog client instance for server-side use.
 * 
 * IMPORTANT: Next.js server functions are short-lived, so you must:
 * 1. Create a new instance with PostHogClient()
 * 2. Use it (capture, identify, getAllFlags, etc.)
 * 3. Call await posthog.shutdown() after each use
 * 
 * Example:
 * ```typescript
 * const posthog = PostHogClient()
 * await posthog.capture({ distinctId: 'user-id', event: 'event_name' })
 * await posthog.shutdown()
 * ```
 * 
 * @returns PostHog client instance or mock client if not configured
 */
export function PostHogClient(): PostHog {
  const apiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST

  // Disable in test and development environments unless explicitly enabled
  if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_POSTHOG_IN_TESTS) {
    return createMockClient()
  }

  if (process.env.NODE_ENV === 'development') {
    return createMockClient()
  }

  // Return mock client if not configured
  if (!apiKey || !host) {
    return createMockClient()
  }

  return new PostHog(apiKey, {
    host,
    flushAt: 1, // Flush immediately (critical for Next.js server functions)
    flushInterval: 0, // No batching (critical for Next.js server functions)
  })
}

/**
 * Creates a mock PostHog client that does nothing.
 * Used when PostHog is not configured or in test environments.
 */
function createMockClient(): PostHog {
  return {
    capture: () => {}, // Synchronous, returns void
    identify: () => {}, // Synchronous, returns void
    shutdown: async () => Promise.resolve(), // Async, returns Promise<void>
    getAllFlags: async () => Promise.resolve({}), // Async, returns Promise<Record<string, FeatureFlagValue>>
    isFeatureEnabled: async () => Promise.resolve(false), // Async, returns Promise<boolean>
  } as unknown as PostHog
}

