"use client";
import {useActionState} from "react";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {InputOTPForm} from "@/components/input-otp-form";
import {emailVerification} from "@/features/auth/actions/email-verification";


const EmailVerificationForm = () => {
    const [actionState, action] = useActionState(emailVerification, EMPTY_ACTION_STATE);


    return (<InputOTPForm action={action} actionState={actionState} />)

}

export {EmailVerificationForm};