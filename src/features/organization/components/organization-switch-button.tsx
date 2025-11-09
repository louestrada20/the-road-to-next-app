"use client"
import {useRouter} from "next/navigation";
import {useActionState} from "react";
import {Form} from "@/components/form/form";
import {EMPTY_ACTION_STATE} from "@/components/form/utils/to-action-state";
import {switchOrganization} from "@/features/organization/actions/switch-organization";

type OrganizationSwitchButtonProps = {
    organizationId: string;
    trigger: React.ReactElement;
}


const OrganizationSwitchButton = ({organizationId, trigger,}: OrganizationSwitchButtonProps) => {
    const router = useRouter();
    const [actionState, action ] = useActionState(switchOrganization.bind(null, organizationId), EMPTY_ACTION_STATE);

    const handleSuccess = () => {
        // Force client-side refresh to update all server components
        router.refresh();
        
        // Dispatch custom event to notify client components (like Footer) to refetch
        window.dispatchEvent(new CustomEvent('organization-switched', { 
            detail: { organizationId } 
        }));
    };

    return (
        <Form action={action} actionState={actionState} onSuccess={handleSuccess}>{trigger}</Form>
    )
}

export default OrganizationSwitchButton;