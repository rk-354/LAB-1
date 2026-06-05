import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders login form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Send magic link")')).toBeVisible()
  })

  test('shows RefinerIQ branding', async ({ page }) => {
    await expect(page.locator('text=RefineIQ')).toBeVisible()
  })

  test('send button is disabled with empty email', async ({ page }) => {
    const btn = page.locator('button:has-text("Send magic link")')
    await expect(btn).toBeDisabled()
  })

  test('send button enables with valid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'operator@refinery.io')
    const btn = page.locator('button:has-text("Send magic link")')
    await expect(btn).toBeEnabled()
  })

  test('send button stays disabled with invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'notanemail')
    const btn = page.locator('button:has-text("Send magic link")')
    await expect(btn).toBeDisabled()
  })

  test('shows check inbox state after sending magic link', async ({ page }) => {
    // Mock the API response
    await page.route('/api/auth', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { message: 'Magic link sent' }, error: null }),
      })
    })

    await page.fill('input[type="email"]', 'test@refinery.io')
    await page.click('button:has-text("Send magic link")')
    await expect(page.locator('text=Check your inbox')).toBeVisible()
  })

  test('shows error message on API failure', async ({ page }) => {
    await page.route('/api/auth', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, error: 'Email not allowed' }),
      })
    })

    await page.fill('input[type="email"]', 'test@refinery.io')
    await page.click('button:has-text("Send magic link")')
    await expect(page.locator('text=Email not allowed')).toBeVisible()
  })

  test('SSO buttons are visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Okta")')).toBeVisible()
    await expect(page.locator('button:has-text("Azure AD")')).toBeVisible()
  })

  test('"Powered by AI" label is visible', async ({ page }) => {
    await expect(page.locator('text=Powered by AI')).toBeVisible()
  })
})
