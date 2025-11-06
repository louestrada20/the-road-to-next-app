import { expect,test } from '@playwright/test'

// Get test credentials from environment
// E2E test users are seeded with these credentials (see prisma/seed.ts)
const TEST_EMAIL = 'e2e-admin@e2e.local'
const TEST_PASSWORD = 'Test123!'

console.log('=== E2E Test Environment ===')
console.log('TEST_EMAIL:', TEST_EMAIL)
console.log('PLAYWRIGHT_BASE_URL:', process.env.PLAYWRIGHT_BASE_URL)
console.log('===========================')

test.describe('Authentication', () => {

  test('should display sign in form', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Check that the sign in form is visible
    // Use exact selector for the card title to avoid strict mode violation
    await expect(page.locator('.text-2xl').filter({ hasText: 'Sign In' })).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Check for sign up link
    await expect(page.getByText(/no account yet/i)).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Wait for form to be ready
    await page.waitForSelector('input[placeholder="Email"]', { state: 'visible' })
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for validation errors - wait a bit for them to appear
    await page.waitForTimeout(500)
    await expect(page.getByText(/is required/i).first()).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'networkidle' })
    
    // Wait for form to be ready
    await page.waitForSelector('input[placeholder="Email"]', { state: 'visible' })
    await page.waitForSelector('button:has-text("Sign In"):not([disabled])', { state: 'visible' })
    
    // Fill in invalid credentials
    await page.fill('input[placeholder="Email"]', 'invalid@example.com')
    await page.fill('input[placeholder="Password"]', 'wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for error message to appear
    await page.waitForTimeout(1000)
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible()
  })

  test('should redirect to tickets page after successful sign in', async ({ page, baseURL }) => {
    console.log('[Test] baseURL from context:', baseURL)
    console.log('[Test] PLAYWRIGHT_BASE_URL env:', process.env.PLAYWRIGHT_BASE_URL)
    console.log('[Test] About to navigate to /sign-in')
    
    await page.goto('/sign-in', { waitUntil: 'networkidle' })
    
    // Wait for the form to be fully loaded and interactive
    await page.waitForSelector('input[placeholder="Email"]', { state: 'visible' })
    await page.waitForSelector('button:has-text("Sign In"):not([disabled])', { state: 'visible' })
    
    // Fill in valid credentials from environment
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    
    console.log('[Test] Form filled, clicking sign in button...')
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForURL('/tickets', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ])
    
    console.log('[Test] Successfully redirected to tickets')
    
    // Use getByRole with the actual heading text "My Tickets"
    await expect(page.getByRole('heading', { name: /my tickets/i })).toBeVisible()
  })

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/tickets')
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in')
  })

  test('should display sign up form', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Check that the sign up form is visible
    // Use exact selector for the card title to avoid strict mode violation
    await expect(page.locator('.text-2xl').filter({ hasText: 'Sign Up' })).toBeVisible()
    await expect(page.getByPlaceholder('Username')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    // There are 2 password fields - check for both specifically
    await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Confirm Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should validate sign up form', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Try to submit with invalid data
    await page.fill('input[placeholder="Username"]', 'u') // Valid - just 1 char is ok
    await page.fill('input[placeholder="Email"]', 'invalid-email')
    await page.fill('input[placeholder="Password"]', '123') // Too short (needs 6)
    await page.fill('input[placeholder="Confirm Password"]', '456') // Different & too short
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Check for validation errors (Zod default messages)
    await expect(page.getByText(/invalid email/i)).toBeVisible()
    await expect(page.getByText(/string must contain at least 6 character/i).first()).toBeVisible()
  })

  test.skip('should handle password reset flow', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Click forgot password link
    await page.getByText(/forgot password/i).click()
    
    // Should navigate to password reset page
    await expect(page).toHaveURL('/password-forgot')
    // Use getByText instead of getByRole since CardTitle is a div, not a semantic heading
    await expect(page.getByText('Forgot Password')).toBeVisible()
    
    // Fill in email and submit
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.getByRole('button', { name: /send email/i }).click()
    
    // Should show success message (wait for it)
    await page.waitForTimeout(1000)
    await expect(page.getByText(/email has been sent/i)).toBeVisible()
  })
})
