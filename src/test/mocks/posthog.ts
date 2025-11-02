import { vi } from 'vitest'

/**
 * PostHog mocks for testing
 */

export const mockPostHogClient = {
  capture: vi.fn(() => Promise.resolve()),
  identify: vi.fn(() => Promise.resolve()),
  reset: vi.fn(() => Promise.resolve()),
  shutdown: vi.fn(() => Promise.resolve()),
  getAllFlags: vi.fn(() => Promise.resolve({})),
  isFeatureEnabled: vi.fn(() => Promise.resolve(false)),
}

export const mockPostHogJs = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  isFeatureEnabled: vi.fn(() => false),
  onFeatureFlags: vi.fn(),
}

export const mockPostHogReact = {
  usePostHog: vi.fn(() => mockPostHogJs),
  useFeatureFlagEnabled: vi.fn(() => false),
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
  PostHogFeature: ({ children }: { children: React.ReactNode }) => children,
}

