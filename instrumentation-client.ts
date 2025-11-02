import posthog from 'posthog-js'

/**
 * PostHog client-side initialization for Next.js 16
 * This file runs automatically in Next.js 16 and initializes PostHog
 * without needing a provider wrapper.
 * 
 * See: https://posthog.com/docs/libraries/next-js
 */
if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  process.env.NEXT_PUBLIC_POSTHOG_HOST &&
  process.env.NODE_ENV === 'production' && // Only track in production
  !process.env.DISABLE_POSTHOG_IN_E2E
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2025-05-24', // Automatic pageview tracking with $pageview and $pageleave
  })
}

