"use client"

import { useState } from "react"
import { Form } from "@/components/form/form"
import {SubmitButton} from "@/components/form/submit-button";
import { ActionState } from "@/components/form/utils/to-action-state"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

type InputOTPFormProps = {
    action: (payload: FormData) => void;
    actionState: ActionState;
    label?: string;
    description?: string;
    buttonText?: string;
}

export function InputOTPForm({
                                 action,
                                 actionState,
                                 label = "Verification Code",
                                 description = "Enter the 8-character verification code sent to your email.",
                                 buttonText = "Verify Email",
                             }: InputOTPFormProps) {
    const [inputData, setInputData] = useState("")

    const handleSubmit = (formData: FormData) => {
        formData.append("otp", inputData) // Add OTP to FormData
        action(formData) // Call the action with modified FormData
    }


    return (
        <Form action={handleSubmit} actionState={actionState}>
            <div className="flex flex-col space-y-6">
                <label className="text-sm font-medium">{label}</label>
                <InputOTP
                    maxLength={8}
                    value={inputData}
                    onChange={setInputData}
                >
                    <InputOTPGroup>
                        {[...Array(8)].map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
                <span className="text-sm text-muted-foreground">{description}</span>
                <SubmitButton label={buttonText} />
            </div>
        </Form>
    )
}
