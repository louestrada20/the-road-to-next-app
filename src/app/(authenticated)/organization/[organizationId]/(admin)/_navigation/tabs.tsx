"use client";

import { useParams, usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs"
import { AdminBadge } from "@/components/admin-badge"
import { invitationsPath, membershipsPath, organizationPath, credentialsPath, subscriptionPath } from "@/paths"; 

const OrganizationBreadcrumbs = () => {
    const params = useParams<{organizationId: string}>();
    const pathName = usePathname();

    const title = {
        memberships: "Memberships" as const,
        invitations: "Invitations" as const,
        credentials: "Credentials" as const,
        subscription: "Subscription" as const,
    }[pathName.split("/").at(-1) as "memberships" | "invitations" | "credentials" | "subscription"];

    return (
        <div className="flex items-center gap-x-2">
            <Breadcrumbs
                breadcrumbs={[
                    {title: "Organizations", href: organizationPath()},
                    {title,
                    dropdown: [
                        {title: "Memberships", href: membershipsPath(params.organizationId)},
                        {title: "Invitations", href: invitationsPath(params.organizationId)},   
                        {title: "Credentials", href: credentialsPath(params.organizationId)},
                        {title: "Subscription", href: subscriptionPath(params.organizationId)},
                    ]
                    }
                ]}
            />
            <AdminBadge />
        </div>
    )
};

export {OrganizationBreadcrumbs};
