import {Prisma} from "@prisma/client";

export type TicketWithMetaData = Prisma.TicketGetPayload<{
    include: {
        user: {
            select: {username: true};
        };
        solvedBy: {
            select: {username: true; firstName: true; lastName: true};
        };
    };
}> & {isOwner: boolean; permissions: {canDeleteTicket: boolean; canUpdateTicket: boolean}};
