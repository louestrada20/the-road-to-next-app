"use client";

import { useParams, usePathname } from "next/navigation";
import { AdminBadge } from "@/components/admin-badge"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { credentialsPath, invitationsPath, leaderboardPath, membershipRequestsPath, membershipsPath, organizationPath, publicRequestsPath, subscriptionPath } from "@/paths"; 

const OrganizationBreadcrumbs = () => {
    const params = useParams<{organizationId: string}>();
    const pathName = usePathname();

    const title = {
        memberships: "Memberships" as const,
        invitations: "Invitations" as const,
        credentials: "Credentials" as const,
        subscription: "Subscription" as const,
        leaderboard: "Leaderboard" as const,
        "public-requests": "Public Requests" as const,
        "membership-requests": "Membership Requests" as const,
    }[pathName.split("/").at(-1) as "memberships" | "invitations" | "credentials" | "subscription" | "leaderboard" | "public-requests" | "membership-requests"];

    return (
        <div className="flex items-center gap-x-2">
            <Breadcrumbs
                breadcrumbs={[
                    {title: "Organizations", href: organizationPath()},
                    {title,
                    dropdown: [
                        {title: "Memberships", href: membershipsPath(params.organizationId)},
                        {title: "Invitations", href: invitationsPath(params.organizationId)},   
                        {title: "Membership Requests", href: membershipRequestsPath(params.organizationId)},
                        {title: "Credentials", href: credentialsPath(params.organizationId)},
                        {title: "Leaderboard", href: leaderboardPath(params.organizationId)},
                        {title: "Public Requests", href: publicRequestsPath(params.organizationId)},
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
