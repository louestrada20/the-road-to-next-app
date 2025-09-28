import { prisma } from "@/lib/prisma";

export const findExistingTicketIds = async (ticketIds: string[]) => {           
  if (!ticketIds.length) return [];
  const rows = await prisma.ticket.findMany({
    where: { id: { in: ticketIds } },
    select: { id: true },
  });
  return rows.map(r => r.id);
};