"use client";

import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state";
import { useActionState } from "react";
import { createCustomerPortal } from "@/features/stripe/actions/create-customer-portal";    
import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";


type CustomerPortalFormProps = {
    organizationId: string | null | undefined;
    children: React.ReactNode;
}

const CustomerPortalForm = ({organizationId, children}: CustomerPortalFormProps) => {
    const [actionState, action] = useActionState(createCustomerPortal.bind(null, organizationId), EMPTY_ACTION_STATE);


    return (
        <Form action={action} actionState={actionState}>
            <Button type="submit">
                {children}
            </Button>
        </Form>
    )
}

export { CustomerPortalForm }