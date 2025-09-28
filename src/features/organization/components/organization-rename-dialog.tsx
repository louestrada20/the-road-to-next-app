"use client"
import { Organization } from "@prisma/client"
import { useActionState, useState } from "react"
import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { renameOrganization } from "@/features/organization/actions/rename-organization"

type OrganizationRenameDialogProps = {
  organization: Organization
  children: React.ReactNode
}

const OrganizationRenameDialog = ({ organization, children }: OrganizationRenameDialogProps) => {
  const [open, setOpen] = useState(false)
  
  const [actionState, action] = useActionState(
    renameOrganization.bind(null, organization.id),
    EMPTY_ACTION_STATE
  )

  const handleSuccess = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Organization</DialogTitle>
          <DialogDescription>
            Change the name of your organization. This will be visible to all members.
          </DialogDescription>
        </DialogHeader>
        
        <Form action={action} actionState={actionState} onSuccess={handleSuccess}>
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter new organization name"
            defaultValue={
              (actionState.payload?.get('name') as string) ?? organization.name
            }
          />
          <FieldError actionState={actionState} name="name" />
          
          <div className="flex gap-x-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton label="Rename Organization" />
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { OrganizationRenameDialog }
