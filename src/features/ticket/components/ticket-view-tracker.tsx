'use client'
import posthog from 'posthog-js'
import { useEffect } from 'react'

type TicketViewTrackerProps = {
  ticketId: string
  organizationId: string
  userId?: string  // Optional - for anonymous tracking
}

export function TicketViewTracker({ 
  ticketId, 
  organizationId, 
  userId 
}: TicketViewTrackerProps) {
  useEffect(() => {
    // Only track in production
    if (process.env.NODE_ENV !== 'production') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    if (process.env.POSTHOG_DISABLE_TICKET_VIEWED === 'true') return
    
    try {
      posthog.capture('ticket_viewed', {
        ticketId,
        organizationId,
        isAuthenticated: !!userId,  // Track whether user is logged in
      })
    } catch (error) {
      // Silently fail - don't break user experience
      console.error('[PostHog] Failed to track ticket view:', error)
    }
  }, [ticketId, userId, organizationId])

  return null
}

