import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuth } from '@/features/auth/actions/get-auth'
import { getActiveOrganizationClient } from '@/features/organization/queries/get-active-organization-client'
import { identifyUser } from '@/lib/posthog/identify-client'
import { createMockUser } from '@/test/factories'
import { createMockActiveOrganization } from '@/test/helpers'
import { asMock } from '@/test/types/mocks'
import { useAuth } from '../use-auth'

// Mock the server actions and client functions
vi.mock('@/features/auth/actions/get-auth')
vi.mock('@/features/organization/queries/get-active-organization-client')
vi.mock('@/lib/posthog/identify-client')

describe('useAuth', () => {
  const mockUser = createMockUser()
  const mockActiveOrg = createMockActiveOrganization(mockUser.id)

  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful auth mock
    asMock(getAuth).mockResolvedValue({
      user: mockUser,
      session: {
        id: 'session-123',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        refreshedAt: null,
      },
      fresh: false,
    })
    asMock(getActiveOrganizationClient).mockResolvedValue(mockActiveOrg)
    asMock(identifyUser).mockResolvedValue(undefined)
  })

  it('should call getAuth exactly once on mount', async () => {
    const { result } = renderHook(() => useAuth())

    // Initially not fetched
    expect(result.current.isFetched).toBe(false)
    expect(result.current.user).toBe(null)

    // Wait for async effect to complete
    await waitFor(() => {
      expect(result.current.isFetched).toBe(true)
    })

    // Verify getAuth was called exactly once
    expect(getAuth).toHaveBeenCalledTimes(1)
    expect(result.current.user).toEqual(mockUser)
  })

  it('should NOT re-fetch on component re-render', async () => {
    const { result, rerender } = renderHook(() => useAuth())

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isFetched).toBe(true)
    })

    // Clear mock call history
    vi.clearAllMocks()

    // Force re-render multiple times
    rerender()
    rerender()
    rerender()

    // Wait a bit to ensure no new calls were made
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify getAuth was NOT called again
    expect(getAuth).not.toHaveBeenCalled()
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isFetched).toBe(true)
  })

  it('should call getActiveOrganizationClient for authenticated users', async () => {
    renderHook(() => useAuth())

    await waitFor(() => {
      expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
    })
  })

  it('should NOT call getActiveOrganizationClient for unauthenticated users', async () => {
    asMock(getAuth).mockResolvedValue({
      user: null,
      session: null,
      fresh: false,
    })

    renderHook(() => useAuth())

    await waitFor(() => {
      expect(getAuth).toHaveBeenCalled()
    })

    // Wait a bit to ensure no calls were made
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(getActiveOrganizationClient).not.toHaveBeenCalled()
    expect(identifyUser).not.toHaveBeenCalled()
  })

  it('should call identifyUser with correct parameters for authenticated users', async () => {
    renderHook(() => useAuth())

    await waitFor(() => {
      expect(identifyUser).toHaveBeenCalledWith(mockUser.id, {
        email: mockUser.email,
        username: mockUser.username,
        organizationId: mockActiveOrg.id,
      })
    })
  })

  it('should set user and isFetched state correctly', async () => {
    const { result } = renderHook(() => useAuth())

    // Initially
    expect(result.current.user).toBe(null)
    expect(result.current.isFetched).toBe(false)

    // After fetch completes
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isFetched).toBe(true)
    })
  })

  it('should handle async operations without errors', async () => {
    const { result } = renderHook(() => useAuth())

    // Should complete fetch successfully
    await waitFor(() => {
      expect(result.current.isFetched).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })

    // No unhandled errors should occur
    expect(getAuth).toHaveBeenCalledTimes(1)
    expect(getActiveOrganizationClient).toHaveBeenCalledTimes(1)
  })

  it('should return consistent reference for user object between re-renders', async () => {
    const { result, rerender } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isFetched).toBe(true)
    })

    const firstUserRef = result.current.user

    // Re-render
    rerender()

    // User reference should be the same (no unnecessary state updates)
    expect(result.current.user).toBe(firstUserRef)
  })
})

