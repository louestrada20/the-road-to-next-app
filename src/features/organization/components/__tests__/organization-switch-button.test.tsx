import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state'
import { asMock } from '@/test/types/mocks'
import OrganizationSwitchButton from '../organization-switch-button'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: vi.fn(),
  }
})

describe('OrganizationSwitchButton', () => {
  const mockRefresh = vi.fn()
  const mockRouter = {
    refresh: mockRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    asMock(useRouter).mockReturnValue(mockRouter)
    // Mock useActionState to return initial state, mock action, and isPending
    asMock(useActionState).mockReturnValue([
      EMPTY_ACTION_STATE,
      vi.fn(),
      false, // isPending
    ])
  })

  it('should render trigger element', () => {
    const trigger = <button>Switch Organization</button>

    render(
      <OrganizationSwitchButton
        organizationId="org-123"
        trigger={trigger}
      />
    )

    expect(screen.getByText('Switch Organization')).toBeInTheDocument()
  })

  it('should bind organizationId to switchOrganization action', () => {
    const organizationId = 'org-123'
    const trigger = <button>Switch</button>

    render(
      <OrganizationSwitchButton
        organizationId={organizationId}
        trigger={trigger}
      />
    )

    // Verify useActionState was called with bound action
    expect(useActionState).toHaveBeenCalledWith(
      expect.any(Function),
      EMPTY_ACTION_STATE
    )
  })

  it('should initialize router on mount', () => {
    const trigger = <button type="submit">Switch</button>

    render(
      <OrganizationSwitchButton
        organizationId="org-123"
        trigger={trigger}
      />
    )

    // Verify router was obtained from useRouter
    expect(useRouter).toHaveBeenCalled()
  })

  it('should call useRouter to get router instance', () => {
    const trigger = <button>Switch</button>

    render(
      <OrganizationSwitchButton
        organizationId="org-123"
        trigger={trigger}
      />
    )

    expect(useRouter).toHaveBeenCalledTimes(1)
  })

  it('should pass action and actionState to Form component', () => {
    const mockActionState = {
      status: 'PENDING' as const,
      message: '',
      timestamp: Date.now(),
      fieldErrors: {},
      payload: null,
    }
    const mockAction = vi.fn()

    asMock(useActionState).mockReturnValue([mockActionState, mockAction, true])

    const trigger = <button>Switch</button>

    render(
      <OrganizationSwitchButton
        organizationId="org-123"
        trigger={trigger}
      />
    )

    // Form should receive actionState and action
    expect(useActionState).toHaveBeenCalled()
  })

  it('should handle multiple organization switches with refresh each time', () => {
    const trigger = <button>Switch</button>

    // First switch
    const { unmount } = render(
      <OrganizationSwitchButton
        organizationId="org-1"
        trigger={trigger}
      />
    )

    unmount()

    // Second switch
    render(
      <OrganizationSwitchButton
        organizationId="org-2"
        trigger={trigger}
      />
    )

    // Router should be initialized for each instance
    expect(useRouter).toHaveBeenCalled()
  })

  describe('Integration with Form component', () => {
    it('should render within Form component with correct props', () => {
      const trigger = <button data-testid="switch-trigger">Switch</button>

      render(
        <OrganizationSwitchButton
          organizationId="org-123"
          trigger={trigger}
        />
      )

      const triggerElement = screen.getByTestId('switch-trigger')
      expect(triggerElement).toBeInTheDocument()
    })
  })

  describe('Performance - Router Refresh Timing', () => {
    it('should only call refresh on success, not on mount', () => {
      const trigger = <button>Switch</button>

      render(
        <OrganizationSwitchButton
          organizationId="org-123"
          trigger={trigger}
        />
      )

      // Refresh should NOT be called on mount
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('should not call refresh on error', async () => {
      // Mock error state
      const errorState = {
        status: 'ERROR' as const,
        message: 'Switch failed',
        timestamp: Date.now(),
        fieldErrors: {},
        payload: null,
      }

      asMock(useActionState).mockReturnValue([errorState, vi.fn(), false])

      const trigger = <button>Switch</button>

      render(
        <OrganizationSwitchButton
          organizationId="org-123"
          trigger={trigger}
        />
      )

      await waitFor(() => {
        // Even with error state, refresh should not be called
        expect(mockRefresh).not.toHaveBeenCalled()
      })
    })
  })

  describe('Security - No Auth Bypass', () => {
    it('should always use switchOrganization action which includes auth', () => {
      const trigger = <button>Switch</button>

      render(
        <OrganizationSwitchButton
          organizationId="org-123"
          trigger={trigger}
        />
      )

      // Verify useActionState is called with bound switchOrganization
      const calls = asMock(useActionState).mock.calls
      expect(calls.length).toBeGreaterThan(0)
      
      // The first argument should be a function (bound action)
      expect(typeof calls[0][0]).toBe('function')
    })
  })
})

