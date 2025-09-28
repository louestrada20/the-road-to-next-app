"use client";
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {changeEmail} from "@/features/account/actions/change-email";
import {AuthUser} from "@/features/auth/types";

type ChangeEmailFormProps = {
    user: AuthUser;
}

const ChangeEmailForm = ({user}: ChangeEmailFormProps) => {
    const [actionState, action] = useActionState(changeEmail, EMPTY_ACTION_STATE);

    return (
        <div className="w-full max-w-[580px] self-center">
            <Form action={action} actionState={actionState}>
                <Label htmlFor="currentEmail">Current Email:</Label>
                <Input 
                    id="currentEmail" 
                    name="currentEmail" 
                    type="email" 
                    value={user.email}
                    disabled
                    className=""
                />
                <p className="text-sm text-gray-600 mb-4">Your current email address</p>

                <Label htmlFor="newEmail">New Email:</Label>
                <Input 
                    id="newEmail" 
                    name="newEmail" 
                    placeholder="Enter your new email address" 
                    type="email" 
                    defaultValue={actionState.payload?.get('newEmail') as string}
                />
                <FieldError actionState={actionState} name="newEmail" />

                <SubmitButton size="sm" label="Change Email" />
            </Form>
        </div>
    );
};

export { ChangeEmailForm };
