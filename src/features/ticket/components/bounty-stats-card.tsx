import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getUserBountyStatsForOrg } from "@/features/ticket/queries/get-user-bounty-stats"

type BountyStatsCardProps = {
    userId: string
    organizationId: string
}

export const BountyStatsCard = async ({ userId, organizationId }: BountyStatsCardProps) => {
    const stats = await getUserBountyStatsForOrg(userId, organizationId)

    // Don't show card if user has no bounty activity
    if (stats.ticketsSolved === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-x-2">
                    <span>💰</span>
                    <span>Your Bounties</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-3xl font-bold text-green-600">
                        {stats.totalEarned}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        from {stats.ticketsPaid} {stats.ticketsPaid === 1 ? 'ticket' : 'tickets'}
                    </p>
                </div>

                {stats.ticketsPending > 0 && (
                    <>
                        <Separator />
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Approval</p>
                            <p className="text-2xl font-semibold text-amber-600">
                                {stats.pendingApproval}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {stats.ticketsPending} {stats.ticketsPending === 1 ? 'ticket' : 'tickets'} awaiting approval
                            </p>
                        </div>
                    </>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Tickets Solved</p>
                    <p className="text-2xl font-bold">{stats.ticketsSolved}</p>
                </div>
            </CardContent>
        </Card>
    )
}

