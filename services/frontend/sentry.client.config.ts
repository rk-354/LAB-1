import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring (free tier friendly)
  tracesSampleRate: 0.1,

  // Don't send PII to Sentry
  beforeSend(event) {
    // Strip user email from error events
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    return event
  },
})
