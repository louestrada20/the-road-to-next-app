
import {getAuth} from "@/features/auth/actions/get-auth";
import {isOwner} from "@/features/auth/utils/is-owner";
import {getTicketPermissions} from "@/features/ticket/permissions/get-ticket-permission";
import {prisma} from "@/lib/prisma"
import {includeUsername} from "@/lib/prisma-helper";

export const getTicket = async(id: string) => {

    const { user } = await getAuth();
    

const ticket = await prisma.ticket.findUnique({
    where: {
        id,
    },
    include: includeUsername,
});
if (!ticket) {
    return null;
}

const permissions = await getTicketPermissions({
    organizationId: ticket.organizationId,
    userId: user?.id
});
return {...ticket, isOwner: isOwner(user, ticket), permissions: {
    canDeleteTicket: isOwner(user, ticket) && !!permissions.canDeleteTicket
    }};
}