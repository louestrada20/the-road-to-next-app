"use client"
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {ActionState, EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {ACCEPTED} from "@/features/attachments/constants";
import {createComment} from "@/features/comment/actions/create-comment";
import {CommentWithMetadata} from "@/features/comment/types";

type CommentCreateFormProps = {
    ticketId: string;
    onCreateComment?: (comment: CommentWithMetadata | undefined) => void;
}

const CommentCreateForm =  ({ ticketId, onCreateComment}: CommentCreateFormProps) => {

    const [actionState, action] = useActionState(
        createComment.bind(null, ticketId),
        EMPTY_ACTION_STATE,
    );
    // <Input  type="hidden" hidden defaultValue={ticketId} name="ticketId"/>  - we can use hidden input field to pass the ticketId to the server action as an alternative.


    const handleSuccess = (actionState: ActionState<CommentWithMetadata | undefined> ) => {
        onCreateComment?.(actionState.data);
    }

    return (
        <Form action={action} actionState={actionState} onSuccess={handleSuccess}>

            <Label htmlFor="content">Content</Label>
            <Textarea  id="content" name="content" placeholder="What's on your mind..." />
            <FieldError actionState={actionState} name="content" />

            <Input 
            name="files" 
            type="file" 
            multiple 
            id="files" 
            accept={ACCEPTED.join(",")}
            />
            <FieldError actionState={actionState} name="files" />
            
            <SubmitButton label={"Comment"} />


        </Form>
    )
}

export {CommentCreateForm}