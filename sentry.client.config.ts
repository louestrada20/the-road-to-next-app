// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Privacy: mask all text content
      blockAllMedia: true, // Privacy: block images/videos
    }),
  ],

  // Adjust sample rate for production (10%) vs development (100%)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable structured logging
  enableLogs: true,

  // Session Replay: 10% of normal sessions
  replaysSessionSampleRate: 0.1,

  // Session Replay: 100% of sessions with errors
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Don't send PII by default for privacy
  sendDefaultPii: false,
});

