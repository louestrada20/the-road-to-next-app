"use client";

import {LucideBan, LucideCheck} from "lucide-react";
import {useActionState} from "react";
import {Form} from "@/components/form/form";
import {SubmitButton} from "@/components/form/submit-button";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {togglePermission} from "@/features/memberships/actions/toggle-permission";

type PermissionToggleProps = {
    userId: string;
    organizationId: string;
    permissionKey: "canDeleteTicket";
    permissionValue: boolean;
}

const PermissionToggle = ({userId, organizationId, permissionKey, permissionValue}: PermissionToggleProps) => {
    const [actionState, action] = useActionState(
        togglePermission.bind(null,{
            userId,
            organizationId,
            permissionKey,
        }),
        EMPTY_ACTION_STATE,
    );

    return (
        <Form action={action} actionState={actionState} >
            <SubmitButton
            icon={permissionValue ? <LucideCheck /> : <LucideBan />}
            size="icon"
            variant={permissionValue ? "secondary" : "outline"}
            />
        </Form>
    )

}

export {PermissionToggle}