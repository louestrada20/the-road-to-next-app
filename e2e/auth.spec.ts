import { expect,test } from '@playwright/test'

test.describe('Authentication', () => {

  test('should display sign in form', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Check that the sign in form is visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Check for sign up link
    await expect(page.getByText(/don't have an account/i)).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for validation errors
    await expect(page.getByText(/is required/i).first()).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Fill in invalid credentials
    await page.fill('input[placeholder="Email"]', 'invalid@example.com')
    await page.fill('input[placeholder="Password"]', 'wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for error message
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible()
  })

  test('should redirect to tickets page after successful sign in', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Fill in valid credentials (you would need to set up test data)
    await page.fill('input[placeholder="Email"]', 'test@example.com')
    await page.fill('input[placeholder="Password"]', 'password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to tickets page
    await expect(page).toHaveURL('/tickets')
    await expect(page.getByRole('heading', { name: /tickets/i })).toBeVisible()
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
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByPlaceholder('Username')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should validate sign up form', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Try to submit with invalid data
    await page.fill('input[placeholder="Username"]', 'a') // Too short
    await page.fill('input[placeholder="Email"]', 'invalid-email')
    await page.fill('input[placeholder="Password"]', '123') // Too short
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Check for validation errors
    await expect(page.getByText(/must contain at least 2 character/i)).toBeVisible()
    await expect(page.getByText(/invalid email/i)).toBeVisible()
    await expect(page.getByText(/must contain at least 6 character/i)).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Click forgot password link
    await page.getByText(/forgot password/i).click()
    
    // Should navigate to password reset page
    await expect(page).toHaveURL('/password-forgot')
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()
    
    // Fill in email
    await page.fill('input[placeholder="Email"]', 'test@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()
    
    // Should show success message
    await expect(page.getByText(/check your email/i)).toBeVisible()
  })
})
