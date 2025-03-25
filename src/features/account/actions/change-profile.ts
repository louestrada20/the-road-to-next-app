"use server"

import {revalidatePath} from "next/cache";
import {z} from "zod"
import {ActionState, fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {prisma} from "@/lib/prisma";
import {accountProfilePath} from "@/paths";


const changeProfileSchema = z.object({
    username: z.string().min(1).max(191),
    firstName: z.string().min(1).max(191),
    lastName: z.string().min(1).max(191),
})


export const changeProfile = async (_actionState: ActionState,  formData: FormData) => {
    const {user} = await getAuthOrRedirect();
    const {id} = user;

    try {
        const data = changeProfileSchema.parse({
            username: formData.get('username'),
            lastName: formData.get('lastName'),
            firstName: formData.get('firstName'),
        })
       await prisma.user.update({
            where: {
                id,
            },
            data
        })

    } catch (error) {
       return fromErrorToActionState(error, formData)
    }

    revalidatePath(accountProfilePath());
    return toActionState("SUCCESS", "Profile updated successfully!")
}