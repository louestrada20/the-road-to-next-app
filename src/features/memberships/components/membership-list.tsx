import {format} from "date-fns";
import {
     LucideBan, LucideCheck,
} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {MembershipDeleteButton} from "@/features/memberships/components/membership-delete-button";
import {MembershipMoreMenu} from "@/features/memberships/components/membership-more-menu";
import {PermissionToggle} from "@/features/memberships/components/permission-toggle";
import {getMemberships} from "@/features/memberships/queries/get-memberships";


type MembershipListProps = {
    organizationId: string,
}

export const MembershipList = async ({organizationId}: MembershipListProps) => {
    const memberships = await getMemberships(organizationId);

    if (!memberships) {
        return null;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="text-sm text-muted-foreground">
                    <TableHead className="w-[100px]">UserName</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined At</TableHead>
                    <TableHead>Verified Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Can Delete Ticket?</TableHead>
                    <TableHead>Can Update Ticket?</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>{
                memberships.map((membership) => {
                    const user = membership.user;



                    const deleteMemberButton = (
                        <MembershipDeleteButton organizationId={membership.organizationId} userId={membership.userId}/>
                    );

                    const membershipMoreMenu = (
                        <MembershipMoreMenu
                        organizationId={membership.organizationId}
                        userId={membership.userId}
                        membershipRole={membership.membershipRole}
                        />
                    )

                    const buttons = (
                        <>
                            {membershipMoreMenu}
                            {deleteMemberButton}
                        </>
                    );




                    return (
                        <TableRow key={membership.frontendId}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{format(membership.joinedAt, "yyyy-MM-dd, HH:mm")}</TableCell>
                            <TableCell>{user.emailVerified ? ( <LucideCheck /> ) : (<LucideBan />)}</TableCell>
                            <TableCell>{membership.membershipRole}</TableCell>
                            <TableCell>
                                <PermissionToggle 
                                userId={membership.userId}
                                organizationId={membership.organizationId}
                                permissionKey="canDeleteTicket"
                                permissionValue={membership.canDeleteTicket}
                                />
                            </TableCell>
                            <TableCell>
                                <PermissionToggle 
                                userId={membership.userId}
                                organizationId={membership.organizationId}
                                permissionKey="canUpdateTicket"
                                permissionValue={membership.canUpdateTicket}
                                />
                            </TableCell>
                            <TableCell className="flex justify-end gap-x-2">{buttons}</TableCell>
                        </TableRow>
                    )




                })
            }
            </TableBody>
        </Table>
    )
}