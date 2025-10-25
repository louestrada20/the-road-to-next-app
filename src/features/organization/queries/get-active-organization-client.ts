"use server"

import { getAuth } from "@/features/auth/actions/get-auth"
import { prisma } from "@/lib/prisma"

export const getActiveOrganizationClient = async () => {
    const { user } = await getAuth()

    if (!user) {
        return null
    }

    const activeOrganization = await prisma.organization.findFirst({
        where: {
            memberships: {
                some: {
                    userId: user.id,
                    isActive: true,
                },
            },
        },
        select: {
            id: true,
            name: true,
        },
    })

    return activeOrganization
}

