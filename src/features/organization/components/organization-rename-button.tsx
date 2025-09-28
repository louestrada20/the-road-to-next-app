import { Organization } from "@prisma/client"
import { LucideEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"
import { getMembership } from "@/features/memberships/queries/get-membership"
import { OrganizationRenameDialog } from "./organization-rename-dialog"

type OrganizationRenameButtonProps = {
  organization: Organization
}

const OrganizationRenameButton = async ({ organization }: OrganizationRenameButtonProps) => {
  const { user } = await getAuthOrRedirect()
  
  // Check if user is admin of this organization
  const membership = await getMembership({
    organizationId: organization.id,
    userId: user.id,
  })

  // Only show button to admins
  if (!membership || membership.membershipRole !== "ADMIN") {
    return null
  }

  return (
    <OrganizationRenameDialog organization={organization}>
      <Button 
        variant="secondary" 
        size="sm"
        className="font-medium"
      >
        <LucideEdit className="w-4 h-4" />
        Rename
      </Button>
    </OrganizationRenameDialog>
  )
}

export { OrganizationRenameButton }
