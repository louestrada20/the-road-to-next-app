"use server"
import * as Sentry from "@sentry/nextjs";
import {revalidatePath} from "next/cache";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import * as ticketService from "@/features/ticket/service";
import { trackCommentDeleted } from "@/lib/posthog/events/comments";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {ticketPath} from "@/paths";

export const deleteComment = async (id: string) => {
    const {user} = await getAuthOrRedirect();

    const comment = await prisma.comment.findUnique({
        where: {
            id
        },
        include: {
            ticket: true
        }
    });

    if (!comment || !isOwner(user, comment)) {
        return toActionState("ERROR", "Not Authorized!");
    }

    try {
        Sentry.addBreadcrumb({
            category: "comment.action",
            message: "Deleting comment",
            level: "info",
            data: { commentId: id, userId: user.id, ticketId: comment.ticketId },
        });

        await prisma.comment.delete({
            where: {
                id
            }
        })

        try {
            await trackCommentDeleted(user.id, comment.ticket.organizationId, {
                commentId: id,
                ticketId: comment.ticketId,
                contentLength: comment.content.length,
            });
        } catch (posthogError) {
            captureSentryError(posthogError, {
                userId: user.id,
                organizationId: comment.ticket.organizationId,
                ticketId: comment.ticketId,
                action: "track-comment-deleted",
                level: "warning", // Analytics failure is non-critical
                tags: { analytics: "posthog" },
            });

            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track comment deleted event:', posthogError);
            }
        }
    } catch (error) {
        captureSentryError(error, {
            userId: user.id,
            ticketId: comment.ticketId,
            action: "delete-comment",
            level: "error", // Critical business operation
        });

        return fromErrorToActionState(error);
    }

    await ticketService.disconnectReferencedTicketsViaComment(comment);

    revalidatePath(ticketPath(comment.ticketId));
    return toActionState("SUCCESS", "Comment deleted.");
}