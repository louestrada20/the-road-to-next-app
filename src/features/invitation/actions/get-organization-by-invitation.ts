"use server"

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/utils/crypto";


export const getOrganizationByInvitation = async (tokenId: string): Promise<string | null> => {

    try {
        // Hash the token to match how it's stored in the database
        const tokenHash = hashToken(tokenId);

        // Find the invitation with the matching token hash
        const invitation = await prisma.invitation.findUnique({
            where: {
                tokenHash,
            },
            include: {
                organization: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (invitation?.organization) {
            return invitation.organization.name;
        } else {
            console.log("Invitation not found, returned null from getOrganizationByInvitation");
            return null;
        }
        // Return the organization name if found, otherwise null
    } catch (error) {
        console.error("Error fetching organization by invitation:", error);
        return null;
    }
};