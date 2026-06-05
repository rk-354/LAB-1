'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: '#060912', color: '#EEF0F7',
        fontFamily: 'Inter, sans-serif', display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ margin: '0 0 24px', color: '#6A7390', fontSize: 14 }}>
            The error has been reported automatically.
          </p>
          <button
            onClick={reset}
            style={{ padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(120deg, #6366F1, #8B5CF6)', color: '#fff',
              fontSize: 14, fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
