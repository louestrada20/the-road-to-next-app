import {Comment} from "@prisma/client";
import * as ticketData from "@/features/ticket/data";
import {prisma} from "@/lib/prisma";
import {findTicketIdsFromText} from "@/utils/find-ids-from-text";
export const disconnectReferencedTicketsViaComment = async (
    comment: Comment,
    ) => {
    const ticketId = comment.ticketId;
    const rawIds = findTicketIdsFromText("tickets", comment.content);

    if(!rawIds.length) return;

    const uniqueIds = Array.from(new Set(rawIds)).filter((id) => id !== ticketId);
    if (!uniqueIds.length) return;

    const existingIds = await ticketData.findExistingTicketIds(uniqueIds);
    if (!existingIds.length) return;


    const comments = await prisma.comment.findMany({
        where: {
            ticketId: comment.ticketId,
            id: {
                not: comment.id,
            }
        }
    });

    const otherRefs = findTicketIdsFromText("tickets", comments.map((comment) => comment.content).join(" "));
    const idsToRemove = existingIds.filter(id => !otherRefs.includes(id));
    if (!idsToRemove.length) return;
    
    await ticketData.disconnectReferencedTickets(ticketId, idsToRemove);


}