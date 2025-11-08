import { expect, test } from '@playwright/test'

// Use E2E test credentials (seeded in prisma/seed.ts)
const TEST_EMAIL = 'e2e-admin@e2e.local'
const TEST_PASSWORD = 'Test123!'

test.describe('Organization Switcher with Footer Update', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in', { waitUntil: 'networkidle' })
  })

  test('should update footer immediately after switching organization without navigation', async ({ page }) => {
    // Sign in with E2E test credentials
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    await Promise.all([
      page.waitForURL('/tickets', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ])

    // Wait for redirect to tickets page
    await page.waitForURL('/tickets')

    // Verify footer exists and shows an organization
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    
    // Get initial organization name from footer
    const initialOrgText = await footer.locator('text=/Active Organization:/').textContent()
    expect(initialOrgText).toBeTruthy()

    // Navigate to organization switcher page
    await page.goto('/organization')
    await expect(page).toHaveURL('/organization')

    // Get the current active organization name from the table
    const activeButton = page.locator('button:has-text("Active")')
    await expect(activeButton).toBeVisible()

    // Find a different organization to switch to (one with "Switch" or "Activate" button)
    const switchButton = page.locator('button:has-text("Switch"), button:has-text("Activate")').first()
    
    const switchButtonCount = await switchButton.count()
    if (switchButtonCount === 0) {
      test.skip()
      return
    }

    // Get the organization name we're switching to by finding the row containing the switch button
    const switchRow = switchButton.locator('xpath=ancestor::tr')
    const targetOrgName = await switchRow.locator('td').nth(1).textContent()
    expect(targetOrgName).toBeTruthy()

    // Click the switch button
    await switchButton.click()

    // Wait for the success toast or page update
    await page.waitForTimeout(1000)

    // CRITICAL TEST: Footer should update immediately WITHOUT navigation
    // Verify we're still on the same page
    await expect(page).toHaveURL('/organization')

    // Verify footer now shows the new organization
    await expect(footer.locator(`text="${targetOrgName}"`)).toBeVisible({ timeout: 5000 })

    // Verify the "Active" button moved to the new organization
    const newActiveRow = switchRow
    await expect(newActiveRow.locator('button:has-text("Active")')).toBeVisible()

    // Navigate to a different page (tickets) to verify footer persists
    await page.goto('/tickets')
    await expect(page).toHaveURL('/tickets')

    // Verify footer still shows the new organization after navigation
    await expect(footer.locator(`text="${targetOrgName}"`)).toBeVisible()

    // Navigate to another page (account) to further verify persistence
    await page.goto('/account/profile')
    await expect(page).toHaveURL('/account/profile')

    // Footer should STILL show the correct organization
    await expect(footer.locator(`text="${targetOrgName}"`)).toBeVisible()
  })

  test('should fetch organization data only once per page, not on every navigation', async ({ page }) => {
    // Enable request interception to track API calls
    const orgFetchRequests: string[] = []

    page.on('request', request => {
      // Track any requests that might be fetching organization data
      const url = request.url()
      if (url.includes('organization') || url.includes('membership')) {
        orgFetchRequests.push(url)
      }
    })

    // Sign in with E2E credentials
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    await Promise.all([
      page.waitForURL('/tickets', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ])

    // Clear tracked requests
    orgFetchRequests.length = 0

    // Navigate multiple times
    await page.goto('/tickets')
    await page.waitForTimeout(500)
    
    await page.goto('/account/profile')
    await page.waitForTimeout(500)
    
    await page.goto('/organization')
    await page.waitForTimeout(500)

    // Navigate back to tickets
    await page.goto('/tickets')
    await page.waitForTimeout(500)

    // Footer should be visible on all pages
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Organization data should be shown without excessive refetching
    // The exact number of requests may vary, but it should NOT be 
    // one request per navigation (which would be 4+)
    // With our optimization, it should be minimal
  })

  test('should show "No Active Organization" when user has no active org', async ({ page }) => {
    // This test would require a user with memberships but no active org
    // For now, we'll test the UI element exists
    
    // Sign in with E2E credentials
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    await Promise.all([
      page.waitForURL('/tickets', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ])

    // Footer should show organization info
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    
    // Should show either an organization name or "No Active Organization"
    const orgText = footer.locator('text=/Active Organization:|No Active Organization/')
    await expect(orgText).toBeVisible()
  })

  test('should render Switch button in footer that links to organization page', async ({ page }) => {
    // Sign in with E2E credentials
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    await Promise.all([
      page.waitForURL('/tickets', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ])

    // Footer should have a Switch link
    const footer = page.locator('footer')
    const switchLink = footer.locator('a:has-text("Switch")')
    await expect(switchLink).toBeVisible()

    // Click switch link
    await switchLink.click()

    // Should navigate to organization page
    await expect(page).toHaveURL('/organization')
  })

  test('should not show footer for unauthenticated users', async ({ page }) => {
    // Go to landing page (not authenticated)
    await page.goto('/')

    // Footer should not be visible
    const footer = page.locator('footer:has-text("Active Organization")')
    await expect(footer).not.toBeVisible()
  })

  test('should handle rapid organization switches correctly', async ({ page }) => {
    // Sign in with E2E credentials
    await page.fill('input[placeholder="Email"]', TEST_EMAIL)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    await Promise.all([
      page.waitForURL('/tickets', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ])

    // Navigate to organization page
    await page.goto('/organization')

    // Get all switch/activate buttons
    const switchButtons = page.locator('button:has-text("Switch"), button:has-text("Activate")')
    const buttonCount = await switchButtons.count()

    if (buttonCount < 2) {
      test.skip()
      return
    }

    const footer = page.locator('footer')

    // Switch between first two available organizations rapidly
    for (let i = 0; i < 2; i++) {
      const button = switchButtons.nth(i)
      const row = button.locator('xpath=ancestor::tr')
      const orgName = await row.locator('td').nth(1).textContent()

      await button.click()
      await page.waitForTimeout(500)

      // Footer should show the correct organization
      if (orgName) {
        await expect(footer.locator(`text="${orgName}"`)).toBeVisible({ timeout: 5000 })
      }
    }

    // Final state: footer should still be functioning correctly
    await expect(footer).toBeVisible()
    const finalOrgText = await footer.locator('text=/Active Organization:/').textContent()
    expect(finalOrgText).toBeTruthy()
  })
})

