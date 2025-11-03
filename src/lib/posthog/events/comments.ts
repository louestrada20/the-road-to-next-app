import 'server-only';
import { PostHogClient } from '../server';
import { type CommentEventProperties,PostHogEvents } from '../types';

async function trackCommentEvent(
    eventName: string,
    properties: CommentEventProperties,
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
            }
        })

        await posthog.shutdown();
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error('[PostHog] Failed to track comment event:', error)
        }
    }
}


export async function trackCommentCreated(
    userId: string,
    organizationId: string,
    properties?: Partial<CommentEventProperties>
): Promise<void> {
    await trackCommentEvent(PostHogEvents.COMMENT_CREATED, {...properties}, userId, organizationId)
}

export async function trackCommentUpdated(
    userId: string,
    organizationId: string,
    properties?: Partial<CommentEventProperties>
): Promise<void> {  
    await trackCommentEvent(PostHogEvents.COMMENT_UPDATED, {...properties}, userId, organizationId)
}


export async function trackCommentDeleted(
    userId: string,
    organizationId: string,
    properties?: Partial<CommentEventProperties>
): Promise<void> {  
     await trackCommentEvent(PostHogEvents.COMMENT_DELETED, {...properties}, userId, organizationId)
}   