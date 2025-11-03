"use client"
import {LucideLoaderCircle, LucideTrash} from "lucide-react";
import {useRouter} from "next/navigation";
import {useConfirmDialog} from "@/components/confirm-dialog";
import {Button} from "@/components/ui/button";
import {deleteOrganization} from "@/features/organization/actions/delete-organization";


type OrganizationDeleteButtonProps = {
    organizationId: string;
}


const OrganizationDeleteButton = ({organizationId}: OrganizationDeleteButtonProps) => {
    const router = useRouter();

    const [deleteButton, deleteDialog] = useConfirmDialog({

        action: deleteOrganization.bind(null, organizationId),
        trigger: (isPending) => (
            <Button variant="destructive" size="icon">
                {isPending ? (
                    <LucideLoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                    <LucideTrash className="h-4 w-4" />
                )}
            </Button>
        ),
        loadingMessage: "Deleting organization...",
        onSuccess: () => {
            router.refresh();
        }
    })

    return (
       <>
           {deleteButton}
           {deleteDialog}
       </>
    )
}

export default OrganizationDeleteButton;