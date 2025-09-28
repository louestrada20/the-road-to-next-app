
import {Comment} from "@prisma/client";
import {findTicketIdsFromText} from "@/utils/find-ids-from-text";
import * as ticketData from "@/features/ticket/data";

export const connectReferencedTicketsViaComment = async (
    comment: Comment,
) => {

    const rawIds = findTicketIdsFromText("tickets", comment.content);
    if (!rawIds.length) return;

    const uniqueIds = Array.from(new Set(rawIds)).filter((id) => id !== comment.ticketId);
   if (!uniqueIds.length) return;

   const existingIds = await ticketData.findExistingTicketIds(uniqueIds);
   const existingSet = new Set(existingIds);
   const missing = uniqueIds.filter((id) => !existingSet.has(id));
   if (missing.length) {    
     throw new Error(`Invalid ticket references: ${missing.join(", ")}`);
   }

    await ticketData.connectReferencedTickets(comment.ticketId, existingIds);
}

