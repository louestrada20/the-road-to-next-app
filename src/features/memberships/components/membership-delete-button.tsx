"use client"
import {LucideLoaderCircle, LucideLogOut} from "lucide-react";
import { useRouter} from "next/navigation";
import {useConfirmDialog} from "@/components/confirm-dialog";
import {Button} from "@/components/ui/button";
import {deleteMembership} from "@/features/memberships/actions/delete-membership";

type MembershipDeleteButtonProps = {
    organizationId: string,
    userId: string,
}

const MembershipDeleteButton = ({organizationId, userId}: MembershipDeleteButtonProps) => {
    const router = useRouter();
    const membershipIds = {
        organizationId: organizationId,
        userId: userId,
    }

    const [deleteButton, deleteDialog] = useConfirmDialog({
       action: deleteMembership.bind(null, membershipIds),
        trigger: (isPending) => (
            <Button variant="destructive" size="icon">
                {isPending ? (
                    <LucideLoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                    <LucideLogOut className="h-4 w-4" />
                )}
            </Button>
        ),
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

export {MembershipDeleteButton};