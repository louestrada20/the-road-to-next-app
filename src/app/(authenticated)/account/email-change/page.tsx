"use client"
import {useActionState} from "react";
import {CardCompact} from "@/components/card-compact";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {InputOTPForm} from "@/components/input-otp-form";
import {verifyEmailChange} from "@/features/account/actions/verify-email-change";
export default function EmailChangeVerify() {
  const [state, action] = useActionState(verifyEmailChange, EMPTY_ACTION_STATE);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <CardCompact
        title="Verify New Email"
        description="Enter the 8-digit code we just emailed you."
        content={<InputOTPForm action={action} actionState={state} />}
      />
    </div>
  );
}