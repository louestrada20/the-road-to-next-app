import { expect,test } from '@playwright/test'
import { AuthHelper } from './fixtures/auth'

test.describe('Tickets', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    
    // Sign in before each test
    // In a real scenario, you'd want to use test data or mocked auth
    await authHelper.signIn('test@example.com', 'password123')
  })

  test('should display tickets list', async ({ page }) => {
    await page.goto('/tickets')
    
    // Check page elements
    await expect(page.getByRole('heading', { name: /tickets/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /new ticket/i })).toBeVisible()
    
    // Check for search and filter elements
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible() // Sort select
  })

  test('should create a new ticket', async ({ page }) => {
    await page.goto('/tickets')
    
    // Click new ticket button
    await page.getByRole('button', { name: /new ticket/i }).click()
    
    // Should navigate to create page
    await expect(page).toHaveURL('/tickets/create')
    await expect(page.getByRole('heading', { name: /create ticket/i })).toBeVisible()
    
    // Fill in ticket form
    await page.fill('input[name="title"]', 'Test Ticket from E2E')
    await page.fill('textarea[name="content"]', 'This is a test ticket created by Playwright E2E test')
    await page.fill('input[name="deadline"]', '2025-12-31')
    await page.fill('input[name="bounty"]', '100.50')
    
    // Submit form
    await page.getByRole('button', { name: /create/i }).click()
    
    // Should redirect to ticket detail page
    await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9-]+$/)
    
    // Verify ticket details are displayed
    await expect(page.getByRole('heading', { name: 'Test Ticket from E2E' })).toBeVisible()
    await expect(page.getByText('This is a test ticket created by Playwright E2E test')).toBeVisible()
    await expect(page.getByText('$100.50')).toBeVisible()
  })

  test('should validate ticket form', async ({ page }) => {
    await page.goto('/tickets/create')
    
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

  test('should edit an existing ticket', async ({ page }) => {
    // First create a ticket
    await page.goto('/tickets/create')
    await page.fill('input[name="title"]', 'Ticket to Edit')
    await page.fill('textarea[name="content"]', 'Original content')
    await page.fill('input[name="deadline"]', '2025-12-31')
    await page.fill('input[name="bounty"]', '50')
    await page.getByRole('button', { name: /create/i }).click()
    
    // Wait for redirect to ticket detail
    await page.waitForURL(/\/tickets\/[a-zA-Z0-9-]+$/)
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click()
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9-]+\/edit$/)
    
    // Update ticket
    await page.fill('input[name="title"]', 'Updated Ticket Title')
    await page.fill('textarea[name="content"]', 'Updated content from E2E test')
    await page.fill('input[name="bounty"]', '75.25')
    
    // Submit update
    await page.getByRole('button', { name: /edit/i }).click()
    
    // Should redirect back to detail page
    await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9-]+$/)
    
    // Verify updates
    await expect(page.getByRole('heading', { name: 'Updated Ticket Title' })).toBeVisible()
    await expect(page.getByText('Updated content from E2E test')).toBeVisible()
    await expect(page.getByText('$75.25')).toBeVisible()
  })

  test('should delete a ticket', async ({ page }) => {
    // First create a ticket
    await page.goto('/tickets/create')
    await page.fill('input[name="title"]', 'Ticket to Delete')
    await page.fill('textarea[name="content"]', 'This ticket will be deleted')
    await page.fill('input[name="deadline"]', '2025-12-31')
    await page.fill('input[name="bounty"]', '25')
    await page.getByRole('button', { name: /create/i }).click()
    
    // Wait for redirect to ticket detail
    await page.waitForURL(/\/tickets\/[a-zA-Z0-9-]+$/)
    
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click()
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm.*delete/i }).click()
    
    // Should redirect to tickets list
    await expect(page).toHaveURL('/tickets')
    
    // Verify ticket is no longer in the list
    await expect(page.getByText('Ticket to Delete')).not.toBeVisible()
  })

  test('should filter tickets by status', async ({ page }) => {
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

  test('should sort tickets', async ({ page }) => {
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

  test('should handle pagination', async ({ page }) => {
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
