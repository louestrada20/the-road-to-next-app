import {Prisma} from "@prisma/client";

export type TicketWithMetaData = Prisma.TicketGetPayload<{
    include: {user: {
            select: {username: true};
        };
    };
}> & {isOwner: boolean};

