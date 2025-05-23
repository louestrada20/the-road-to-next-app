"use server"

import { v4 as uuidv4 } from 'uuid';
import {fromErrorToActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {prisma} from "@/lib/prisma";



export const getMemberships = async (organizationId: string) => {
    await getAuthOrRedirect();


    try {
        const memberships = await prisma.membership.findMany({
            where: {
                organizationId: organizationId,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        emailVerified: true,
                    }
                }
            },
        });

        const frontendMemberships = memberships.map(membership => ({
            ...membership,
            frontendId: uuidv4(), // Generate a unique ID for the frontend
        }));

        return frontendMemberships;
    } catch (error) {
        fromErrorToActionState(error)
    }
}