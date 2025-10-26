import { AdminBadge } from "@/components/admin-badge"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Heading } from "@/components/heading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PublicRequestList } from "@/features/ticket/components/public-request-list"
import { getPendingPublicRequests } from "@/features/ticket/queries/get-pending-public-requests"
import { organizationPath } from "@/paths"

type PublicRequestsPageProps = {
    params: Promise<{
        organizationId: string
    }>
}

const PublicRequestsPage = async ({ params }: PublicRequestsPageProps) => {
    const { organizationId } = await params

    const pendingRequests = await getPendingPublicRequests(organizationId)

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <div className="flex items-center gap-x-2">
                <Breadcrumbs
                    breadcrumbs={[
                        { title: "Organizations", href: organizationPath() },
                        { title: "Public Requests" }
                    ]}
                />
                <AdminBadge />
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <Heading
                        title="Public Ticket Requests"
                        description="Approve or deny requests to make tickets publicly visible"
                    />
                </CardHeader>
                <CardContent>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No pending public ticket requests
                        </p>
                    ) : (
                        <PublicRequestList 
                            requests={pendingRequests} 
                            organizationId={organizationId}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default PublicRequestsPage

