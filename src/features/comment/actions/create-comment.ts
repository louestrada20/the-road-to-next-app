"use server";

import {revalidatePath} from "next/cache";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import * as attachmentSubjectDTO from "@/features/attachments/dto/attachment-subject-dto";
import { filesSchema } from "@/features/attachments/schema/files";
import * as attachmentService from "@/features/attachments/service";   
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import * as commentData from "@/features/comment/data";
import * as ticketService from "@/features/ticket/service";
import { trackCommentCreated } from "@/lib/posthog/events/comments";
import {ticketPath} from "@/paths";

const createCommentSchema = z.object({
    content: z.string().min(1).max(1024),
    files: filesSchema,
})

export const createComment = async (ticketId: string, _actionState: ActionState, formData: FormData) => {
    const {user} = await getAuthOrRedirect();
    if (!ticketId) {
        throw new Error("ticketId is required");
    }

    let comment;

    try {

        const {content, files} = createCommentSchema.parse({
            content: formData.get("content"),
            files: formData.getAll("files"),
        });


    comment = await commentData.createComment({
        userId: user.id,
        ticketId,
        content,
        options: {
            includeUser: true,
            includeTicket: true,
        }
    });

    const subject = attachmentSubjectDTO.fromComment(comment);

    if (!subject) {
      return toActionState("ERROR", "Comment not created");
    }



        await attachmentService.createAttachments({
            subject,   
            entity: "COMMENT",
            files,
            entityId: comment.id,
        });


        await ticketService.connectReferencedTicketsViaComment(comment);        

        try {
            await trackCommentCreated(user.id, comment.ticket.organizationId, {
                commentId: comment.id,
                ticketId: ticketId,
                contentLength: content.length,
                hasAttachments: files.length > 0,
                attachmentCount: files.length,
            });
        } catch (posthogError) {
            if (process.env.NODE_ENV === "development") {
                console.error('[PostHog] Failed to track comment created event:', posthogError);
            }
        }
    } catch (error) {
        return fromErrorToActionState(error, formData);
    }
    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Comment created", undefined, {...comment, isOwner: true});

}