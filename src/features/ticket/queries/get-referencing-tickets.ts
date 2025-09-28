import {prisma} from "@/lib/prisma";

export const getReferencingTickets = async (ticketId: string) => {
    const ticket = await prisma.ticket.findUnique({
        where: {id: ticketId},
        include: {
            referencingTickets: true,
        },
    });

    return ticket?.referencingTickets ?? [];
}