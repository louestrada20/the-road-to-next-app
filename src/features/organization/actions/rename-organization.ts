"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { setCookieByKey } from "@/actions/cookies"
import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect"
import { prisma } from "@/lib/prisma"
import { organizationPath } from "@/paths"

const renameOrganizationSchema = z.object({
  name: z.string().min(1, { message: "Organization name is required" }).max(191, { message: "Organization name must be less than 191 characters" }),
})

export const renameOrganization = async (
  organizationId: string,
  _actionState: ActionState,
  formData: FormData
) => {
  // Check admin permissions
  const { user, activeOrganization } = await getAdminOrRedirect(organizationId)

  try {
    // Validate input
    const data = renameOrganizationSchema.parse({
      name: formData.get("name"),
    })

    // Update organization name
    await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        name: data.name,
      },
    })

  } catch (error) {
    return fromErrorToActionState(error, formData)
  }

  // Revalidate organization page
  revalidatePath(organizationPath())
  
  // Success feedback
  await setCookieByKey("toast", "Organization renamed successfully")
  
  return toActionState("SUCCESS", "Organization renamed successfully")
}
