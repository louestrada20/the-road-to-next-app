import {getAuth} from "@/features/auth/actions/get-auth";
import {isOwner} from "@/features/auth/utils/is-owner";
import {ParsedSearchParams} from "@/features/ticket/search-params";
import { prisma } from "@/lib/prisma"
import {includeUsername} from "@/lib/prisma-helper";

export const getTickets = async (userId: string | undefined, searchParams: ParsedSearchParams) => {
const { user}  = await getAuth();
    const where =  {
        userId,
            title: {
            contains: searchParams.search,
                mode: "insensitive" as const,
        },
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


 return {
        list: tickets.map((ticket) => ({
            ...ticket,
                isOwner: isOwner(user, ticket),
        })),
     metadata: {
            count,
         hasNextPage: count > skip + take,
     }
 }

}