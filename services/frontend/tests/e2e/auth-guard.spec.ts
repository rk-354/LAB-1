import { test, expect } from '@playwright/test'

test.describe('Auth guard (middleware)', () => {
  test('redirects unauthenticated user from / to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects unauthenticated user from /api-protected routes to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page is accessible without auth', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('login page renders the aurora background', async ({ page }) => {
    await page.goto('/login')
    // Check aurora blobs exist (they're absolute-positioned divs)
    const body = await page.locator('body').innerHTML()
    expect(body).toContain('aurora')
  })
})
