"use client"
import {useActionState} from "react";
import {FieldError} from "@/components/form/field-error";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {signUp} from "@/features/auth/actions/sign-up";

const SignUpForm = () => {
    const [actionState, action] = useActionState(signUp, EMPTY_ACTION_STATE);


    return <Form actionState={actionState} action={action}>
        <Label htmlFor="title">Username</Label>
        <Input name="username" placeholder="Username" defaultValue={actionState.payload?.get('username') as string} />
        <FieldError actionState={actionState} name="username" />
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="Email" defaultValue={actionState.payload?.get('email') as string}/>
        <FieldError actionState={actionState} name="email" />
        <Label htmlFor="password">Password</Label>
        <Input name="password" type="password" placeholder="Password" defaultValue={actionState.payload?.get('password') as string}/>
        <FieldError actionState={actionState} name="password" />
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input name="confirmPassword" type="password"  placeholder="Confirm Password" defaultValue={actionState.payload?.get('confirmPassword') as string}/>
        <FieldError actionState={actionState} name="confirmPassword" />
        <SubmitButton label="Sign Up" />
    </Form>

}

export {SignUpForm};