import { prisma } from "@/lib/prisma"

export const getComment = async (id: string) => {
   const comment =  await prisma.comment.findUnique({
        where: {
            id,
        },
    });

    return comment;
}