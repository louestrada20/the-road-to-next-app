import { Page } from '@playwright/test'

// Get test credentials from environment
// E2E test users are seeded with these credentials (see prisma/seed.ts)
const TEST_EMAIL = 'e2e-admin@e2e.local'
const TEST_PASSWORD = 'Test123!'

export class AuthHelper {
  constructor(private page: Page) {}

  async signIn(email: string = TEST_EMAIL, password: string = TEST_PASSWORD) {
    console.log(`[AuthHelper] Attempting sign in with email: ${email}`)
    
    await this.page.goto('/sign-in', { waitUntil: 'networkidle' })
    
    // Wait for the form to be fully loaded and interactive
    await this.page.waitForSelector('input[placeholder="Email"]', { state: 'visible' })
    await this.page.waitForSelector('button:has-text("Sign In"):not([disabled])', { state: 'visible' })
    
    await this.page.fill('input[placeholder="Email"]', email)
    await this.page.fill('input[placeholder="Password"]', password)
    
    console.log(`[AuthHelper] Form filled, clicking sign in button...`)
    
    // Click and wait for navigation
    await Promise.all([
      this.page.waitForURL('/tickets', { timeout: 10000 }),
      this.page.getByRole('button', { name: /sign in/i }).click()
    ])
    
    console.log(`[AuthHelper] Successfully signed in, URL: ${this.page.url()}`)
  }

  async signOut() {
    // Click on the user menu
    await this.page.click('[data-testid="user-menu"]')
    
    // Click sign out
    await this.page.click('button:has-text("Sign Out")')
    
    // Wait for redirect to sign in page
    await this.page.waitForURL('/sign-in', { timeout: 5000 })
  }

  async isSignedIn(): Promise<boolean> {
    try {
      // Check if we're on a protected page
      const url = this.page.url()
      return url.includes('/tickets') || url.includes('/account') || url.includes('/organization')
    } catch {
      return false
    }
  }

  async getAuthenticatedCookies() {
    const cookies = await this.page.context().cookies()
    return cookies.filter(cookie => cookie.name === 'session')
  }

  async setAuthCookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string; expires?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' }>) {
    await this.page.context().addCookies(cookies)
  }
}
