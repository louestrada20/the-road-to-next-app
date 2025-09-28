"use server";

import {revalidatePath} from "next/cache";
import {z} from "zod";
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {ticketPath} from "@/paths";
import { filesSchema } from "@/features/attachments/schema/files";
import * as attachmentService from "@/features/attachments/service";   
import * as commentData from "@/features/comment/data";
import * as attachmentSubjectDTO from "@/features/attachments/dto/attachment-subject-dto";
import * as ticketService from "@/features/ticket/service";
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


    } catch (error) {
        return fromErrorToActionState(error, formData);
    }
    revalidatePath(ticketPath(ticketId));
    return toActionState("SUCCESS", "Comment created", undefined, {...comment, isOwner: true});

}