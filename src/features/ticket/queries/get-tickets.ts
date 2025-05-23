import {getAuth} from "@/features/auth/actions/get-auth";
import {isOwner} from "@/features/auth/utils/is-owner";
import {getActiveOrganization} from "@/features/organization/queries/get-active-organization";
import {getOrganizationsByUser} from "@/features/organization/queries/get-organizations-by-user";
import {ParsedSearchParams} from "@/features/ticket/search-params";
import { prisma } from "@/lib/prisma"
import {includeUsername} from "@/lib/prisma-helper";

export const getTickets = async (userId: string | undefined, byOrganization: boolean, searchParams: ParsedSearchParams ) => {

    const { user}  = await getAuth();
    const activeOrganization = await getActiveOrganization();
    
    const where =  {
        userId,
            title: {
            contains: searchParams.search,
                mode: "insensitive" as const,
        },
        ...(byOrganization && activeOrganization ? {
            organizationId: activeOrganization.id,
            }
            : {}),
    }

    const skip = searchParams.page * searchParams.size;
    const take = searchParams.size;




    const [tickets, count] = await prisma.$transaction([
        prisma.ticket.findMany({
            where,
            skip,
            take,
            orderBy: {
                [searchParams.sortKey]: searchParams.sortValue
            },
            include: includeUsername
        }),
        prisma.ticket.count({
            where,
        })
    ])


    const organizationByUser = await getOrganizationsByUser();

 return {
        list: tickets.map((ticket) => {

            const organization = organizationByUser.find((organization) => organization.id === ticket.organizationId)

           return {
               ...ticket,
               isOwner: isOwner(user, ticket),
               permissions: {
                   canDeleteTicket: isOwner(user, ticket) && !!organization?.membershipByUser.canDeleteTicket,
               },
           }
        }),
     metadata: {
            count,
         hasNextPage: count > skip + take,
     }
 }

}