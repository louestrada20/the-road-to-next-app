import 'server-only'
import {PostHogClient } from '../server'
import {PostHogEvents, type TicketEventProperties} from '../types'

async function trackTicketEvent(
    eventName: string,
    properties: TicketEventProperties,
    userId: string,
    organizationId: string,
): Promise<void> {
    if (!process.env.POSTHOG_API_KEY && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return
    }

    try {
        const posthog =  PostHogClient()

        posthog.capture({
            distinctId: userId,
            event: eventName,
            properties: {
                ...properties,
                organizationId,
            },
        })
        // shutdown posthog client (required for next.js server functions)
        await posthog.shutdown()
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[PostHog] Failed to track ticket event:', error);
        }
    }


}


export async function trackTicketCreated(
    userId: string,
    organizationId: string,
    properties?: Partial<TicketEventProperties>
): Promise<void> {
    await trackTicketEvent(PostHogEvents.TICKET_CREATED,  {...properties}, userId, organizationId)
}


export async function trackTicketUpdated(
    userId: string,
    organizationId: string,
    properties?: Partial<TicketEventProperties>
): Promise<void> {
    await trackTicketEvent(PostHogEvents.TICKET_UPDATED,  {...properties}, userId, organizationId)
}


export async function trackTicketDeleted(
    userId: string,
    organizationId: string,
    properties?: Partial<TicketEventProperties>
): Promise<void> {
    await trackTicketEvent(PostHogEvents.TICKET_DELETED,  {...properties}, userId, organizationId)
}


export async function trackTicketViewed(
    userId: string,
    organizationId: string,
    properties?: Partial<TicketEventProperties>
): Promise<void> {
    if (process.env.POSTHOG_DISABLE_TICKET_VIEWED === 'true') {
        return
    }
    await trackTicketEvent(PostHogEvents.TICKET_VIEWED,  {...properties}, userId, organizationId)
}


export async function trackTicketStatusChanged(
    userId: string,
    organizationId: string,
    properties?: Partial<TicketEventProperties>
): Promise<void> {
    await trackTicketEvent(PostHogEvents.TICKET_STATUS_CHANGED,  {...properties}, userId, organizationId)
}