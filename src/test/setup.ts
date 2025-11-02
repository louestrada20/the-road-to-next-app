import '@testing-library/jest-dom'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
    $connect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    attachment: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createManyAndReturn: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    stripeCustomer: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  limitIp: vi.fn(() => Promise.resolve({ success: true })),
  limitEmail: vi.fn(() => Promise.resolve({ success: true })),
}))

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

// Mock Resend
vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: vi.fn(() => Promise.resolve({ id: 'test-email-id' })),
    },
  },
}))

// Import Vercel Blob mocks
import './mocks/vercel-blob'

// Mock Inngest
vi.mock('@/lib/inngest', () => ({
  inngest: {
    send: vi.fn(() => Promise.resolve({ ids: ['test-id'] })),
    createFunction: vi.fn(),
  },
}))

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    isFeatureEnabled: vi.fn(() => false),
    onFeatureFlags: vi.fn(),
  },
}))

vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    capture: vi.fn(() => Promise.resolve()),
    identify: vi.fn(() => Promise.resolve()),
    shutdown: vi.fn(() => Promise.resolve()),
    getAllFlags: vi.fn(() => Promise.resolve({})),
    isFeatureEnabled: vi.fn(() => Promise.resolve(false)),
  })),
}))

vi.mock('@posthog/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
  usePostHog: vi.fn(() => ({
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    isFeatureEnabled: vi.fn(() => false),
  })),
  useFeatureFlagEnabled: vi.fn(() => false),
  PostHogFeature: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock instrumentation-client.ts
vi.mock('../../instrumentation-client', () => ({}))

// Mock PostHog server client
vi.mock('@/lib/posthog/server', () => ({
  PostHogClient: vi.fn(() => ({
    capture: vi.fn(), // Synchronous, returns void
    identify: vi.fn(), // Synchronous, returns void
    shutdown: vi.fn(() => Promise.resolve()),
    getAllFlags: vi.fn(() => Promise.resolve({})),
    isFeatureEnabled: vi.fn(() => Promise.resolve(false)),
  })),
}))

// Mock PostHog client-side identify
vi.mock('@/lib/posthog/identify-client', () => ({
  identifyUser: vi.fn(),
}))

// Mock PostHog server-side identify
vi.mock('@/lib/posthog/identify-server', () => ({
  identifyUserServer: vi.fn(() => Promise.resolve()),
}))

// Mock PostHog Stripe event tracking
vi.mock('@/lib/posthog/events-stripe', () => ({
  trackCheckoutSessionCreated: vi.fn(() => Promise.resolve()),
  trackSubscriptionCreated: vi.fn(() => Promise.resolve()),
  trackSubscriptionUpdated: vi.fn(() => Promise.resolve()),
  trackSubscriptionCanceled: vi.fn(() => Promise.resolve()),
  trackPaymentFailed: vi.fn(() => Promise.resolve()),
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
