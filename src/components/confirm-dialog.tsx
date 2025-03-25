
import {cloneElement, useActionState, useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {useActionFeedback} from "@/components/form/hooks/use-action-feedback";
import {ActionState, EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";


type UseConfirmDialogProps = {
    action: () => Promise<ActionState>;
    trigger: React.ReactElement | ((isPending: boolean) => React.ReactElement);
    title?: string;
    description?: string;
    onSuccess?: (actionState: ActionState) => void;
}

const useConfirmDialog = ({
                           action,
                           trigger,
                           onSuccess,
                           title = "Are you absolutely sure?",
                           description = "This action cannot be undone. Make sure you understand the consequences."}:
                           UseConfirmDialogProps) => {
    const [actionState, formAction, isPending] = useActionState(action, EMPTY_ACTION_STATE)
    const [isOpen, setIsOpen] = useState<boolean>(false);



    const dialogTrigger = cloneElement(typeof trigger === "function" ? trigger(isPending) : trigger, {
        onClick: () => setIsOpen((state) => !state),
    } as React.DOMAttributes<HTMLElement>)

    const toastRef = useRef<string  | number | null>(null)
    useEffect(() => {
        if (isPending) {
            toastRef.current = toast.loading('Deleting...');
        } else if (toastRef.current) {
            toast.dismiss(toastRef.current);
        }
        return () => {
            if (toastRef.current) {
                toast.dismiss(toastRef.current)
            }
        }
    }, [isPending]);



    useActionFeedback(actionState, {
        onSuccess: ({actionState}) => {
            if (actionState.message) {
                toast.success(actionState.message);
            }
            onSuccess?.(actionState);
        },
        onError: ({actionState}) => {
            if (actionState.message) {
                toast.error(actionState.message);
            }
        },
    });

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

                        <form action={formAction}>
                            <Button type="submit"> Confirm </Button>
                        </form>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return [dialogTrigger, dialog ]
};

export {useConfirmDialog};