"use server";


import {getAdminOrRedirect} from "@/features/memberships/queries/get-admin-or-redirect";
import {prisma} from "@/lib/prisma";

export const getCredentials = async (organizationId: string) => {
    await getAdminOrRedirect(organizationId);

    return await prisma.credential.findMany({
        where: {
            organizationId,
        },
        select: {
            id: true,
            createdAt: true,
            name: true,
            lastUsed: true,
            revokedAt: true,
        }
    })
}