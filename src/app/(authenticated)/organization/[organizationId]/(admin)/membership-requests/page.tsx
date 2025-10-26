import { AdminBadge } from "@/components/admin-badge"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Heading } from "@/components/heading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MembershipRequestList } from "@/features/invitation/components/membership-request-list"
import { getPendingMembershipRequests } from "@/features/invitation/queries/get-pending-membership-requests"
import { organizationPath } from "@/paths"

type MembershipRequestsPageProps = {
    params: Promise<{
        organizationId: string
    }>
}

const MembershipRequestsPage = async ({ params }: MembershipRequestsPageProps) => {
    const { organizationId } = await params

    const pendingRequests = await getPendingMembershipRequests(organizationId)

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <div className="flex items-center gap-x-2">
                <Breadcrumbs
                    breadcrumbs={[
                        { title: "Organizations", href: organizationPath() },
                        { title: "Membership Requests" }
                    ]}
                />
                <AdminBadge />
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <Heading
                        title="Membership Requests"
                        description="Approve or deny user requests to join this organization"
                    />
                </CardHeader>
                <CardContent>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No pending membership requests
                        </p>
                    ) : (
                        <MembershipRequestList 
                            requests={pendingRequests} 
                            organizationId={organizationId}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default MembershipRequestsPage

