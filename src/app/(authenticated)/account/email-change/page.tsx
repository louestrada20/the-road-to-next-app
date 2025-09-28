"use client"
import {CardCompact} from "@/components/card-compact";

import {verifyEmailChange} from "@/features/account/actions/verify-email-change";
import {InputOTPForm} from "@/components/input-otp-form";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {useActionState} from "react";
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