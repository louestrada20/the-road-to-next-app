import * as Sentry from "@sentry/nextjs";

export type ErrorContext = {
    userId?: string;
    organizationId?: string;
    ticketId?: string;
    action?: string;
    level?: "error" | "warning" | "info";
    tags?: Record<string, string>;
};

export const captureSentryError = (
    error: unknown,
    context: ErrorContext
) => {
    Sentry.captureException(error, {
        level: context.level || "error",
        tags: {
            action: context.action,
            ...context.tags,
        },
        user: context.userId ? {id: context.userId} : undefined,
        contexts: {
            organization: context.organizationId ? {
                organizationId: context.organizationId,
            } : undefined,
            ticket: context.ticketId ? {
                ticketId: context.ticketId,
            } : undefined,
        }
        
    });
}