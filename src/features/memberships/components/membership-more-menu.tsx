"use client"

import {MembershipRole} from "@prisma/client";
import {LucideUserCog} from "lucide-react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuLabel,DropdownMenuRadioGroup,
DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {updateMembershipRole} from "@/features/memberships/actions/update-membership-role"

type MembershipMoreMenuProps = {
    organizationId: string,
    userId: string,
    membershipRole: MembershipRole,
}

const MembershipMoreMenu = ({organizationId, userId, membershipRole}: MembershipMoreMenuProps) => {

    const handleUpdateMembershipRole = async (value: string) => {
        const promise = updateMembershipRole({
            userId,
            organizationId,
            membershipRole: value as MembershipRole
        });

        toast.promise(promise, {
            loading: "Updating role..."
        });

        const result = await promise;

        if (result.status === "ERROR") {
            toast.error(result.message);
        } else {
            toast.success(result.message);
        }
    };


    return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <LucideUserCog className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Roles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={membershipRole} onValueChange={handleUpdateMembershipRole}>
                        <DropdownMenuRadioItem value="ADMIN">Admin</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="MEMBER">Member</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
    )

}

export {MembershipMoreMenu}