"use server"
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { setCookieByKey } from "@/actions/cookies"
import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { getAdminOrRedirect } from "@/features/memberships/queries/get-admin-or-redirect"
import { prisma } from "@/lib/prisma"
import { captureSentryError } from "@/lib/sentry/capture-error";
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
  const { user } = await getAdminOrRedirect(organizationId)

  try {
    Sentry.addBreadcrumb({
      category: "organization.action",
      message: "Renaming organization",
      level: "info",
      data: { organizationId, userId: user.id },
    });

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
    captureSentryError(error, {
      userId: user.id,
      organizationId,
      action: "rename-organization",
      level: "error", // Critical business operation
    });

    return fromErrorToActionState(error, formData)
  }

  // Revalidate organization page
  revalidatePath(organizationPath())

  // Success feedback
  await setCookieByKey("toast", "Organization renamed successfully")

  return toActionState("SUCCESS", "Organization renamed successfully")
}
