import { Page } from '@playwright/test'

// Bypass real auth for E2E tests by injecting a mock Supabase session cookie
// In CI, use a real test user from env vars
export async function loginAs(page: Page, role: 'admin' | 'manager' | 'end_user' = 'admin') {
  // Navigate to the app — middleware will redirect to /login
  await page.goto('/')

  // For E2E testing, we use the app's UI flow
  // If TEST_EMAIL/TEST_PASSWORD are set, attempt real login
  const testEmail = process.env.E2E_TEST_EMAIL
  if (testEmail) {
    await page.fill('input[type="email"]', testEmail)
    await page.click('button:has-text("Send magic link")')
    // In CI, magic link is intercepted — for local, manually confirm
    return
  }

  // Local dev: inject session via localStorage (Supabase client reads this)
  // This is acceptable for smoke testing the UI without full auth flow
  await page.evaluate(() => {
    // Signal to the app that we want to skip auth (only works in test mode)
    window.sessionStorage.setItem('e2e-skip-auth', 'true')
  })
}
