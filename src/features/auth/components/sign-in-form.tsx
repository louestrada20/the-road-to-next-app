"use client";
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {signIn} from "@/features/auth/actions/sign-in";

const SignInForm = () => {
    const [actionState, action] = useActionState(signIn, EMPTY_ACTION_STATE);


    return <Form actionState={actionState} action={action}>

        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="Email" defaultValue={actionState.payload?.get('email') as string} />
        <FieldError actionState={actionState} name="email" />
        <Label htmlFor="password">Password</Label>
        <Input name="password" type="password" placeholder="Password" defaultValue={actionState.payload?.get('password') as string} />
        <FieldError actionState={actionState} name="password" />
        <SubmitButton label="Sign In" />
    </Form>

}

export {SignInForm};