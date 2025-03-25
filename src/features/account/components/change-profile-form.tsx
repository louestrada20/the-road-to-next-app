"use client"
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {changeProfile} from "@/features/account/actions/change-profile";
import {AuthUser} from "@/features/auth/types";

type ChangeProfileFormProps = {
    user: AuthUser;
}


const ChangeProfileForm =  ({user}: ChangeProfileFormProps) => {





const [actionState, action] = useActionState(changeProfile, EMPTY_ACTION_STATE);


return (
    <div className="w-full max-w-[580px]  self-center ">
    <Form action={action} actionState={actionState}>
        <Label htmlFor="username">Username:</Label>
        <Input id="username" name="username" placeholder="Enter your username"  type="text" defaultValue={
            ( actionState.payload?.get('username') as string) ??  user?.username
        } />
        <FieldError actionState={actionState} name="username" />

        <Label htmlFor="firstName">First name:</Label>
        <Input id="firstName" name="firstName" placeholder="Enter your First name" type="text" defaultValue={
            ( actionState.payload?.get('firstName') as string) ??  user?.firstName
        } />
        <FieldError actionState={actionState} name="firstName" />

        <Label htmlFor="lastName">Last name:</Label>
        <Input id="lastName" name="lastName" placeholder="Enter your Last name" type="text" defaultValue={
            ( actionState.payload?.get('lastName') as string) ??  user?.lastName
        } />
        <FieldError actionState={actionState} name="lastName" />

            <SubmitButton size="sm" label="Update Profile" />
    </Form>
    </div>
)
}

export { ChangeProfileForm }