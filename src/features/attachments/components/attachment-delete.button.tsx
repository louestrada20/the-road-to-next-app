"use client"



import {LucideLoaderCircle, LucideTrash} from "lucide-react";
import {useRouter} from "next/navigation";
import {useConfirmDialog} from "@/components/confirm-dialog";
import {Button} from "@/components/ui/button";
import {deleteAttachment} from "@/features/attachments/actions/delete-attachment";

type AttachmentDeleteButtonProps = {
    id: string;
    onDeleteAttachment?: (id: string) => void;
}

const AttachmentDeleteButton = ({id, onDeleteAttachment}: AttachmentDeleteButtonProps) => {
   const router = useRouter();

    const [deleteButton, deleteDialog] = useConfirmDialog({
        action: deleteAttachment.bind(null, id),
        trigger: (isPending) => (
            <Button variant="ghost" size="xs">
                {isPending ? (
                    <LucideLoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                    <LucideTrash className="w-4 h-4" />
                )
                }
            </Button>
        ),
        loadingMessage: "Deleting attachment...",
        onSuccess: () => {
            onDeleteAttachment?.(id);
            router.refresh();
        },
    });

    return (
        <>
            {deleteDialog}
            {deleteButton}
        </>
    )
};

export {AttachmentDeleteButton};