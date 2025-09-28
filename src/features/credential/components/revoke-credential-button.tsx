"use client";

import { revokeCredential } from "../queries/revoke-credential";

import { LucideLoaderCircle, LucideTrash } from "lucide-react";    

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useConfirmDialog } from "@/components/confirm-dialog";



type RevokeCredentialButtonProps = {
    organizationId: string;
    credentialId: string;
}
export const RevokeCredentialButton = ({ organizationId, credentialId }: RevokeCredentialButtonProps) => {
    const router = useRouter();
    const [deleteButton, deleteDialog] = useConfirmDialog({
        action: revokeCredential.bind(null, organizationId, credentialId),
         trigger: (isPending) => (
             <Button variant="destructive" size="icon" title="Revoke Credential">
                 {isPending ? (
                     <LucideLoaderCircle  className="h-4 w-4 animate-spin" />
                 ) : (
                     <LucideTrash className="h-4 w-4" />
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