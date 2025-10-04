import { Page } from '@playwright/test'

export class AuthHelper {
  constructor(private page: Page) {}

  async signIn(email: string, password: string) {
    await this.page.goto('/sign-in')
    await this.page.fill('input[placeholder="Email"]', email)
    await this.page.fill('input[placeholder="Password"]', password)
    await this.page.click('button:has-text("Sign In")')
    
    // Wait for navigation to complete
    await this.page.waitForURL('/tickets', { timeout: 10000 })
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

  async setAuthCookies(cookies: any[]) {
    await this.page.context().addCookies(cookies)
  }
}
