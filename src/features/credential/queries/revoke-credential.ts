"use server";
import { toActionState } from "@/components/form/utils/to-action-state";
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect";
import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";


export const revokeCredential = async (organizationId: string, credentialId: string) => {
    await getAdminOrRedirect(organizationId);

    await prisma.credential.update({
        where: {
            id: credentialId,
        },
        data: { 
            revokedAt: new Date(),  
        },
    });

    revalidatePath(`/organization/${organizationId}/credentials`);
    
    return toActionState("SUCCESS", "Credential revoked");
}