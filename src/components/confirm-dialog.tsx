
import {cloneElement, useActionState, useState} from "react";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {ActionState, EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


type UseConfirmDialogProps = {
    action: () => Promise<ActionState>;
    trigger: React.ReactElement;
    title?: string;
    description?: string;
}

const useConfirmDialog = ({
                           action,
                           trigger,
                           title = "Are you absolutely sure?",
                           description = "This action cannot be undone. Make sure you understand the consequences."}:
                           UseConfirmDialogProps) => {
    const [actionState, formAction] = useActionState(action, EMPTY_ACTION_STATE)
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const dialogTrigger = cloneElement(trigger, {
        onClick: () => setIsOpen((state) => !state),
    } as React.DOMAttributes<HTMLElement>)



    const handleSuccess = () => {
        setIsOpen(false);
    }

    const dialog = (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Form action={formAction} actionState={actionState} onSuccess={handleSuccess}>
                            <SubmitButton label="Confirm" />
                        </Form>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return [dialogTrigger, dialog ]
};

export {useConfirmDialog};