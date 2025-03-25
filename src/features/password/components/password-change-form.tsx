"use client"
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {passwordChange} from "@/features/password/actions/password-change";




const PasswordChangeForm =  () => {
    // no need to check for user here, we will not prefill the password out from user object
    // we auth check on the page level too or redirect if not authenticated.


    const [actionState, action] = useActionState(passwordChange, EMPTY_ACTION_STATE);


    return (
        <div className="w-full max-w-[580px]  self-center ">
            <Form action={action} actionState={actionState}>
                <Label htmlFor="password">Password:</Label>
                <Input  name="password" placeholder="Enter your current password"  type="password" defaultValue={
                    ( actionState.payload?.get('password') as string)
                } />
                <FieldError actionState={actionState} name="password" />

                <SubmitButton  label="Send Email" />
            </Form>
        </div>
    )
}

export { PasswordChangeForm }