'use client'

import { useFeatureFlagEnabled } from '@posthog/react'

type FeatureFlagProps = {
  flag: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Feature flag component that conditionally renders children based on PostHog feature flag.
 * 
 * Usage:
 * ```tsx
 * <FeatureFlag flag="new-feature" fallback={<OldFeature />}>
 *   <NewFeature />
 * </FeatureFlag>
 * ```
 * 
 * @param flag - Feature flag name in PostHog
 * @param children - Content to render when flag is enabled
 * @param fallback - Content to render when flag is disabled (optional)
 */
export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const enabled = useFeatureFlagEnabled(flag)

  if (enabled) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

