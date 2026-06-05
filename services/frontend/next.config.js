const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],
  },
}

// Wrap with Sentry — only active when SENTRY_DSN is set
module.exports = withSentryConfig(nextConfig, {
  silent: true,                // Suppress Sentry build output
  disableServerWebpackPlugin: !process.env.SENTRY_DSN,
  disableClientWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
})
