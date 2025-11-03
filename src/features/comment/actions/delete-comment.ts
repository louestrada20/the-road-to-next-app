"use server"
import {revalidatePath} from "next/cache";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {isOwner} from "@/features/auth/utils/is-owner";
import * as ticketService from "@/features/ticket/service";
import { trackCommentDeleted } from "@/lib/posthog/events/comments";
import {prisma} from "@/lib/prisma";
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
        } catch (error) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track comment deleted event:', error);
            }
        }
    } catch (error) {
        return fromErrorToActionState(error);
    }

    await ticketService.disconnectReferencedTicketsViaComment(comment);

    revalidatePath(ticketPath(comment.ticketId));
    return toActionState("SUCCESS", "Comment deleted.");
}