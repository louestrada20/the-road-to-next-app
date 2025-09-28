"use client";

import { AttachmentEntity } from "@prisma/client";
import {useActionState, useEffect,useRef} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {ACCEPTED} from "@/features/attachments/constants";
import {createAttachments} from "../actions/create-attachments"

type AttachmentCreateFormProps = {
    entityId: string;
    entity: AttachmentEntity;
    buttons?: React.ReactNode;
    onSuccess?: () => void; 
    onError?: () => void;
}

const AttachmentCreateForm = ({entityId, entity, buttons, onSuccess, onError}: AttachmentCreateFormProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [actionState, action] = useActionState(
        createAttachments.bind(null, {entityId, entity}),
        EMPTY_ACTION_STATE
    );



    // Reset form when action is successful
    useEffect(() => {
        console.log("Action state changed:", actionState.status, actionState.message);
        if (actionState.status === "SUCCESS" && fileInputRef.current) {
            fileInputRef.current.value = '';
            console.log("Form reset after successful upload");
        }
    }, [actionState.status, actionState.message]);

    const handleSuccess = () => {
        console.log("Upload successful, form reset");
        onSuccess?.();
    };

    const handleError = () => {
        console.log("Upload failed, keeping form data");
        onError?.();
    };

    return  (
        <Form 
            action={action} 
            actionState={actionState} 
            onSuccess={handleSuccess}
            onError={handleError}
        >
            <Input
                ref={fileInputRef}
                name="files"
                id="files"
                type="file"
                multiple
                accept={ACCEPTED.join(",")}
            />
            <FieldError actionState={actionState} name="files" />

            {buttons || <SubmitButton label="Upload" />}
        </Form>
    )
}

export {AttachmentCreateForm}