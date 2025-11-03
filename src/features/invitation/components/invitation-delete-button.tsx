"use client";

import {LucideLoaderCircle, LucideTrash} from "lucide-react";
import {useRouter} from "next/navigation";
import {useConfirmDialog} from "@/components/confirm-dialog";
import {Button} from "@/components/ui/button";
import {deleteInvitation} from "@/features/invitation/actions/delete-invitation";


type InvitationDeleteButtonProps = {
    email: string;
    organizationId: string;
};

const InvitationDeleteButton = ({email, organizationId}: InvitationDeleteButtonProps) => {

    const router = useRouter();

    const [deleteButton, deleteDialog] = useConfirmDialog({
        action:  deleteInvitation.bind(null, {email, organizationId}),
        trigger: (isPending) => (
            <Button variant="destructive" size="icon" >
                {isPending ? (
                    <LucideLoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                    <LucideTrash className="w-4 h-4" />
                )}
            </Button>
        ),
        loadingMessage: "Deleting invitation...",
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

export {InvitationDeleteButton};
