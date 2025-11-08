import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getActiveOrganizationClient } from '@/features/organization/queries/get-active-organization-client'
import { createMockUser } from '@/test/factories'
import { createMockActiveOrganization } from '@/test/helpers'
import { asMock } from '@/test/types/mocks'
import { Footer } from '../footer'

// Mock dependencies
vi.mock('@/features/auth/hooks/use-auth')
vi.mock('@/features/organization/queries/get-active-organization-client')

describe('Footer', () => {
  const mockUser = createMockUser()
  const mockActiveOrg = createMockActiveOrganization(mockUser.id)

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user with fetched state
    asMock(useAuth).mockReturnValue({
      user: mockUser,
      isFetched: true,
    })
    asMock(getActiveOrganizationClient).mockResolvedValue(mockActiveOrg)
  })

  describe('Organization Fetching Behavior', () => {
    it('should fetch active organization only once on mount', async () => {
      render(<Footer />)

      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
      })

      // Verify organization is displayed
      await waitFor(() => {
        expect(screen.getByText(mockActiveOrg.name)).toBeInTheDocument()
      })
    })

    it('should NOT re-fetch on component re-render', async () => {
      const { rerender } = render(<Footer />)

      // Wait for initial fetch
      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
      })

      // Clear mock call history
      vi.clearAllMocks()

      // Force re-renders
      rerender(<Footer />)
      rerender(<Footer />)
      rerender(<Footer />)

      // Wait a bit to ensure no new calls
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should NOT have been called again
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    })

    it('should re-fetch when user changes', async () => {
      const { rerender } = render(<Footer />)

      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
      })

      // Change user
      const newUser = createMockUser({ id: 'user-2', email: 'newuser@example.com' })
      asMock(useAuth).mockReturnValue({
        user: newUser,
        isFetched: true,
      })

      rerender(<Footer />)

      // Should fetch again for new user
      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalledTimes(2)
      })
    })

    it('should re-fetch when isFetched changes from false to true', async () => {
      // Start with isFetched: false
      asMock(useAuth).mockReturnValue({
        user: mockUser,
        isFetched: false,
      })

      const { rerender } = render(<Footer />)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not have fetched yet
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()

      // Change to isFetched: true
      asMock(useAuth).mockReturnValue({
        user: mockUser,
        isFetched: true,
      })

      rerender(<Footer />)

      // Should now fetch
      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Display Behavior', () => {
    it('should return null when user is not fetched', () => {
      asMock(useAuth).mockReturnValue({
        user: mockUser,
        isFetched: false,
      })

      const { container } = render(<Footer />)

      expect(container.firstChild).toBeNull()
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    })

    it('should return null when user is not authenticated', () => {
      asMock(useAuth).mockReturnValue({
        user: null,
        isFetched: true,
      })

      const { container } = render(<Footer />)

      expect(container.firstChild).toBeNull()
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    })

    it('should return null while fetching organization', async () => {
      const { container } = render(<Footer />)

      // Initially null while fetching
      expect(container.firstChild).toBeNull()

      // After fetch completes, should render
      await waitFor(() => {
        expect(container.firstChild).not.toBeNull()
      })
    })

    it('should display active organization name when loaded', async () => {
      render(<Footer />)

      await waitFor(() => {
        expect(screen.getByText('Active Organization:')).toBeInTheDocument()
        expect(screen.getByText(mockActiveOrg.name)).toBeInTheDocument()
      })
    })

    it('should display "No Active Organization" when org is null', async () => {
      asMock(getActiveOrganizationClient).mockResolvedValue(null)

      render(<Footer />)

      await waitFor(() => {
        expect(screen.getByText('No Active Organization')).toBeInTheDocument()
      })
    })

    it('should render organization icon', async () => {
      render(<Footer />)

      await waitFor(() => {
        const icon = document.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should render switch button with correct link', async () => {
      render(<Footer />)

      await waitFor(() => {
        const switchLink = screen.getByRole('link', { name: /switch/i })
        expect(switchLink).toHaveAttribute('href', '/organization')
      })
    })
  })

  describe('Security - No Auth Bypass', () => {
    it('should only fetch organization for authenticated users', async () => {
      asMock(useAuth).mockReturnValue({
        user: null,
        isFetched: true,
      })

      render(<Footer />)

      // Wait to ensure no calls
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should NOT have called getActiveOrganizationClient
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    })

    it('should wait for auth to complete before fetching organization', async () => {
      asMock(useAuth).mockReturnValue({
        user: mockUser,
        isFetched: false,
      })

      render(<Footer />)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should NOT fetch org until isFetched is true
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle null organization gracefully', async () => {
      // Test with null organization (valid scenario)
      asMock(getActiveOrganizationClient).mockResolvedValue(null)

      render(<Footer />)

      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalled()
      })

      // Should display "No Active Organization"
      await waitFor(() => {
        expect(screen.getByText('No Active Organization')).toBeInTheDocument()
      })
    })
  })

  describe('Performance - Dependency Array Correctness', () => {
    it('should only depend on user and isFetched, not pathname', async () => {
      const { rerender } = render(<Footer />)

      await waitFor(() => {
        expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
      })

      // Clear mocks
      vi.clearAllMocks()

      // Simulate multiple re-renders (as if navigation happened)
      for (let i = 0; i < 5; i++) {
        rerender(<Footer />)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Should NOT have fetched again
      expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    })
  })
})

