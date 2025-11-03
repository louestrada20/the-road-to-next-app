import 'server-only';
import { PostHogClient } from '../server';
import { type OrganizationEventProperties,PostHogEvents } from '../types';


async function trackOrganizationEvent(
    eventName: string,
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    if (!process.env.POSTHOG_API_KEY && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return
    }

    try {
        const posthog = PostHogClient()

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
            console.error('[PostHog] Failed to track organization event:', error)
        }
    }
}

export async function trackOrganizationCreated(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    await trackOrganizationEvent(PostHogEvents.ORGANIZATION_CREATED, userId, organizationId, properties)
}

export async function trackOrganizationDeleted(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    await trackOrganizationEvent(PostHogEvents.ORGANIZATION_DELETED, userId, organizationId, properties)
}

export async function trackMembershipCreated(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    await trackOrganizationEvent(PostHogEvents.MEMBERSHIP_CREATED, userId, organizationId, properties)
}

export async function trackMembershipDeleted(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    await trackOrganizationEvent(PostHogEvents.MEMBERSHIP_DELETED, userId, organizationId, properties)
}

export async function trackMembershipRoleUpdated(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    await trackOrganizationEvent(PostHogEvents.MEMBERSHIP_ROLE_UPDATED, userId, organizationId, properties)
}

export async function trackOrganizationSwitched(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {  
    await trackOrganizationEvent(PostHogEvents.ORGANIZATION_SWITCHED, userId, organizationId, properties)
}

export async function trackPermissionChanged(
    userId: string,
    organizationId: string,
    properties?: Partial<OrganizationEventProperties>
): Promise<void> {
    await trackOrganizationEvent(PostHogEvents.PERMISSION_CHANGED, userId, organizationId, properties)
}