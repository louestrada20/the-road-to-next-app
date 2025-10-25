import { expect,test } from '@playwright/test'
import { AuthHelper } from './fixtures/auth'

test.describe('Tickets', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    
    // Sign in with default test credentials from environment
    await authHelper.signIn()
  })

  test.skip('should display tickets list', async ({ page }) => {
    await page.goto('/tickets')
    
    // Check page elements - actual heading is "My Tickets"
    await expect(page.getByRole('heading', { name: /my tickets/i })).toBeVisible()
    
    // Check for the inline create form (no separate "New Ticket" button)
    await expect(page.getByText('Create Ticket')).toBeVisible()
    
    // Check for search and filter elements
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible() // Sort select
  })

  test.skip('should create a new ticket', async ({ page }) => {
    await page.goto('/tickets')
    
    // The create form is inline on the tickets page
    await expect(page.getByText('Create Ticket')).toBeVisible()
    
    // Fill in ticket form
    await page.fill('input[name="title"]', 'Test Ticket from E2E')
    await page.fill('textarea[name="content"]', 'This is a test ticket created by Playwright E2E test')
    
    // DatePicker has a hidden input - set it via JavaScript
    await page.evaluate(() => {
      const input = document.querySelector('input[name="deadline"]') as HTMLInputElement
      if (input) input.value = '2025-12-31'
    })
    
    await page.fill('input[name="bounty"]', '100.50')
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL(/\/tickets\/[a-zA-Z0-9-]+$/, { timeout: 10000 }),
      page.getByRole('button', { name: /create/i }).click()
    ])
    
    // Verify ticket details are displayed
    await expect(page.getByText('Test Ticket from E2E')).toBeVisible()
    await expect(page.getByText('This is a test ticket created by Playwright E2E test')).toBeVisible()
    await expect(page.getByText('$100.50')).toBeVisible()
  })

  test.skip('should validate ticket form', async ({ page }) => {
    await page.goto('/tickets')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create/i }).click()
    
    // Check for validation errors
    await expect(page.getByText(/is required/i).first()).toBeVisible()
    
    // Fill with invalid data
    await page.fill('input[name="deadline"]', 'invalid-date')
    await page.fill('input[name="bounty"]', '-50')
    await page.getByRole('button', { name: /create/i }).click()
    
    // Check for specific validation errors
    await expect(page.getByText(/is required/i)).toBeVisible() // Title still required
    await expect(page.getByText(/positive/i)).toBeVisible() // Bounty must be positive
  })

  test.skip('should edit an existing ticket', async ({ page }) => {
    // First create a ticket
    await page.goto('/tickets')
    await page.fill('input[name="title"]', 'Ticket to Edit')
    await page.fill('textarea[name="content"]', 'Original content')
    await page.evaluate(() => {
      const input = document.querySelector('input[name="deadline"]') as HTMLInputElement
      if (input) input.value = '2025-12-31'
    })
    await page.fill('input[name="bounty"]', '50')
    
    // Submit and wait for redirect
    await Promise.all([
      page.waitForURL(/\/tickets\/[a-zA-Z0-9-]+$/),
      page.getByRole('button', { name: /create/i }).click()
    ])
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click()
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9-]+\/edit$/)
    
    // Update ticket
    await page.fill('input[name="title"]', 'Updated Ticket Title')
    await page.fill('textarea[name="content"]', 'Updated content from E2E test')
    await page.fill('input[name="bounty"]', '75.25')
    
    // Submit update and wait for redirect
    await Promise.all([
      page.waitForURL(/\/tickets\/[a-zA-Z0-9-]+$/),
      page.getByRole('button', { name: /edit/i }).click()
    ])
    
    // Verify updates
    await expect(page.getByText('Updated Ticket Title')).toBeVisible()
    await expect(page.getByText('Updated content from E2E test')).toBeVisible()
    await expect(page.getByText('$75.25')).toBeVisible()
  })

  test.skip('should delete a ticket', async ({ page }) => {
    // First create a ticket
    await page.goto('/tickets')
    await page.fill('input[name="title"]', 'Ticket to Delete')
    await page.fill('textarea[name="content"]', 'This ticket will be deleted')
    await page.evaluate(() => {
      const input = document.querySelector('input[name="deadline"]') as HTMLInputElement
      if (input) input.value = '2025-12-31'
    })
    await page.fill('input[name="bounty"]', '25')
    
    // Submit and wait for redirect
    await Promise.all([
      page.waitForURL(/\/tickets\/[a-zA-Z0-9-]+$/),
      page.getByRole('button', { name: /create/i }).click()
    ])
    
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click()
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /delete/i }).nth(1).click()
    
    // Should redirect to tickets list
    await expect(page).toHaveURL('/tickets')
    
    // Verify ticket is no longer in the list
    await expect(page.getByText('Ticket to Delete')).not.toBeVisible()
  })

  test.skip('should filter tickets by status', async ({ page }) => {
    await page.goto('/tickets')
    
    // Click on status filter (assuming there are tabs or filter buttons)
    await page.getByRole('tab', { name: /open/i }).click()
    
    // Verify URL params updated
    await expect(page).toHaveURL(/status=OPEN/)
    
    // Click on closed filter
    await page.getByRole('tab', { name: /closed/i }).click()
    
    // Verify URL params updated
    await expect(page).toHaveURL(/status=CLOSED/)
  })

  test('should search tickets', async ({ page }) => {
    await page.goto('/tickets')
    
    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'test search query')
    
    // Wait for debounce (if implemented)
    await page.waitForTimeout(500)
    
    // Verify URL params updated
    await expect(page).toHaveURL(/search=test\+search\+query/)
  })

  test.skip('should sort tickets', async ({ page }) => {
    await page.goto('/tickets')
    
    // Select sort option
    await page.selectOption('select', 'newest')
    
    // Verify URL params updated
    await expect(page).toHaveURL(/sort=newest/)
    
    // Try another sort option
    await page.selectOption('select', 'bounty')
    
    // Verify URL params updated
    await expect(page).toHaveURL(/sort=bounty/)
  })

  test.skip('should handle pagination', async ({ page }) => {
    await page.goto('/tickets')
    
    // Look for pagination controls
    const nextButton = page.getByRole('link', { name: /next/i })
    
    // If pagination exists, test it
    if (await nextButton.isVisible()) {
      await nextButton.click()
      
      // Verify URL params updated
      await expect(page).toHaveURL(/page=2/)
      
      // Go back to first page
      await page.getByRole('link', { name: /previous/i }).click()
      await expect(page).toHaveURL(/tickets/)
    }
  })
})
