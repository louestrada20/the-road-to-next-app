import {Prisma} from "@prisma/client"

export type CommentWithMetadata = Prisma.CommentGetPayload<{
    include: {
        user: {
            select: {
                username: true,
                lastName: true,
                firstName: true,
            }
        }
    }
}> & {isOwner: boolean};