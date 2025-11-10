// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production (10%) vs development (100%)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable structured logging
  enableLogs: true,

  // Integrations
  integrations: [
    // Capture Prisma queries for better debugging
    Sentry.prismaIntegration(),
    
    // Optional: Auto-capture console logs
    Sentry.consoleLoggingIntegration({ 
      levels: ["error", "warn"] 
    }),
  ],

  environment: process.env.NODE_ENV,

  // Only send errors in production to avoid noise
  enabled: process.env.NODE_ENV === 'production',

  // Ignore expected errors to reduce noise
  ignoreErrors: [
    // Rate limiting (expected behavior)
    'Too many requests',
    'Rate limit exceeded',
    // Next.js expected behaviors
    'NEXT_REDIRECT', // Next.js redirects are not errors
    'NEXT_NOT_FOUND', // Next.js not found is expected
    // Auth expected failures
    'Incorrect email or password',
    'Invalid or expired code',
    // Authorization expected denials
    'Not authorized',
    'Not Authorized',
  ],

  // Don't send PII by default for privacy
  sendDefaultPii: false,
});
