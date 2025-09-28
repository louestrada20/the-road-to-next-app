import { AttachmentEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateAttachmentsArgs = {
    entity: AttachmentEntity;
    entityId: string;
    name: string;
}


export const createAttachment = async ({entity, entityId, name}: CreateAttachmentsArgs) => { 
return await prisma.attachment.create({
    data: {
        name,
         ...(entity === "TICKET" ? {ticketId: entityId} : {}),
         ...(entity === "COMMENT" ? {commentId: entityId} : {}),
         entity,
    }
})

}