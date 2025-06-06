"use client";



import {useParams, usePathname} from "next/navigation";
import {Breadcrumbs} from "@/components/breadcrumbs"
import {invitationsPath, membershipsPath, organizationPath} from "@/paths";

const OrganizationBreadCrumbs = () => {
    const params = useParams<{organizationId: string}>();
    const pathName = usePathname();

    const title = {
        memberships: "Memberships" as const,
        invitations: "Invitations" as const,
    }[pathName.split("/").at(-1) as "memberships" | "invitations"];

    return (
        <Breadcrumbs
        breadcrumbs={[
            {title: "Organizations", href: organizationPath()},
            {title,
            dropdown: [
                {title: "Memberships", href: membershipsPath(params.organizationId)},
                {title: "Invitations", href: invitationsPath(params.organizationId)},
            ]
            }
        ]}
        />
    )
};



export {OrganizationBreadCrumbs};
