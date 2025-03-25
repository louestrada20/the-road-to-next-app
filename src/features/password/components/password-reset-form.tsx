"use client";
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {passwordReset} from "@/features/password/actions/password-reset";

type PasswordResetFormProps = {
    tokenId: string,
}

const PasswordResetForm = ({tokenId}: PasswordResetFormProps) => {
    const [actionState, action] = useActionState(passwordReset.bind(null, tokenId), EMPTY_ACTION_STATE);


    return <Form actionState={actionState} action={action}>

        <Label htmlFor="password">New Password</Label>
        <Input type="password" name="password" placeholder="Password" defaultValue={actionState.payload?.get('password') as string} />
        <FieldError actionState={actionState} name="password" />

        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input type="password" name="confirmPassword" placeholder="Confirm Password" defaultValue={actionState.payload?.get('confirmPassword') as string} />
        <FieldError actionState={actionState} name="confirmPassword" />

        <SubmitButton label="Reset Password" />
    </Form>

}

export {PasswordResetForm};