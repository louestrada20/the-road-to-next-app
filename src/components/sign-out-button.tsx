'use client'

import posthog from 'posthog-js'
import { useTransition } from 'react'
import { signOut } from '@/features/auth/actions/sign-out'

type SignOutButtonProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Client-side sign-out button that resets PostHog before signing out.
 * Use this instead of directly calling the signOut server action when
 * PostHog reset is needed.
 */
export function SignOutButton({ children, className }: SignOutButtonProps) {
  const [_isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    // Reset PostHog session before signing out
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      try {
        posthog.reset()
      } catch (error) {
        // Don't break sign-out if PostHog fails
        if (process.env.NODE_ENV === 'development') {
          console.error('[PostHog] Failed to reset:', error)
        }
      }
    }

    // Call server action to sign out
    startTransition(() => {
      signOut()
    })
  }

  return (
    <form action={handleSignOut} className={className}>
      {children}
    </form>
  )
}

