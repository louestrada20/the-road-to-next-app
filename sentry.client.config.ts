// This file configures the initialization of Sentry on the client (browser).
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production (10%) vs development (100%)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Client-side integrations
  integrations: [
    // Track performance of route transitions, component renders, etc.
    Sentry.browserTracingIntegration({
      // Track all route transitions
      enableInp: true,
    }),

    // Session Replay - record user sessions when errors occur
    // This is INCREDIBLY valuable for debugging user-reported issues
    Sentry.replayIntegration({
      // Privacy: mask all text content
      maskAllText: true,
      // Privacy: block all media (images, videos)
      blockAllMedia: true,
      // Mask all user input for security
      maskAllInputs: true,
    }),

    // Capture user feedback
    Sentry.feedbackIntegration({
      colorScheme: "system",
      showBranding: false,
    }),
  ],

  // Session Replay sample rates
  // 10% of all sessions will be recorded
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // 100% of sessions with errors will be recorded
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Only send errors in production to avoid noise
  enabled: process.env.NODE_ENV === 'production',

  // Ignore expected client-side errors to reduce noise
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors (expected)
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // Next.js expected behaviors
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
    // Rate limiting (expected)
    'Too many requests',
    'Rate limit exceeded',
    // Resize Observer errors (browser quirks, not actionable)
    'ResizeObserver loop',
  ],

  // Don't send PII by default for privacy
  sendDefaultPii: false,

  // Filter out unwanted breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Don't log console.log breadcrumbs in production (too noisy)
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },
});
