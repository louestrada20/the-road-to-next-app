import 'server-only'
import {PostHogClient} from "../server";
import {type AttachmentEventProperties,PostHogEvents} from "../types";


async function trackAttachmentEvent(
    eventName: string,
    userId: string,
    organizationId: string,
    properties?: Partial<AttachmentEventProperties>
): Promise<void> {
    if (!process.env.POSTHOG_API_KEY && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return
    }

    try {

        const posthog = PostHogClient();

        posthog.capture({
            distinctId: userId,
            event: eventName,
            properties: {
                ...properties,
                organizationId,
            },
        });

        await posthog.shutdown();
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error('[PostHog] Failed to track attachment event:', error);
        }
    }
}


export async function trackAttachmentCreated(
    userId: string,
    organizationId: string,
    properties?: Partial<AttachmentEventProperties>
): Promise<void> {
    await trackAttachmentEvent(PostHogEvents.ATTACHMENT_CREATED, userId, organizationId, properties);
}


export async function trackAttachmentDeleted(
    userId: string,
    organizationId: string,
    properties?: Partial<AttachmentEventProperties>
): Promise<void> {
    await trackAttachmentEvent(PostHogEvents.ATTACHMENT_DELETED, userId, organizationId, properties)
}