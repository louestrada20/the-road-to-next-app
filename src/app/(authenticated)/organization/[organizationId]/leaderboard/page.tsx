import { Breadcrumbs } from "@/components/breadcrumbs"
import { Heading } from "@/components/heading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"
import { getBountyLeaderboard } from "@/features/ticket/queries/get-bounty-leaderboard"
import { organizationPath } from "@/paths"

type LeaderboardPageProps = {
    params: Promise<{
        organizationId: string
    }>
}

const LeaderboardPage = async ({ params }: LeaderboardPageProps) => {
    const { organizationId } = await params

    // Ensure user is authenticated and member of organization
    await getAuthOrRedirect()

    const leaderboard = await getBountyLeaderboard(organizationId, 20)

    if (leaderboard.length === 0) {
        return (
            <div className="flex-1 flex flex-col gap-y-8">
                <Breadcrumbs
                    breadcrumbs={[
                        { title: "Organizations", href: organizationPath() },
                        { title: "Bounty Leaderboard" }
                    ]}
                />
                <Separator />
                <Card>
                    <CardHeader>
                        <Heading
                            title="🏆 Bounty Leaderboard"
                            description="Top bounty earners in this organization"
                        />
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center py-8">
                            No bounties have been paid yet in this organization.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <Breadcrumbs
                breadcrumbs={[
                    { title: "Organizations", href: organizationPath() },
                    { title: "Bounty Leaderboard" }
                ]}
            />
            <Separator />
            <Card>
                <CardHeader>
                    <Heading
                        title="🏆 Bounty Leaderboard"
                        description="Top bounty earners in this organization"
                    />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Rank</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Tickets Solved</TableHead>
                                <TableHead className="text-right">Total Earned</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((entry, index) => (
                                <TableRow key={entry.user?.id || index}>
                                    <TableCell className="font-medium">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `#${index + 1}`}
                                    </TableCell>
                                    <TableCell>
                                        {entry.user ? (
                                            <div>
                                                <div className="font-medium">
                                                    {entry.user.username}
                                                </div>
                                                {(entry.user.firstName || entry.user.lastName) && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {entry.user.firstName} {entry.user.lastName}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Unknown User</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {entry.ticketsSolved}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {entry.totalEarned}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default LeaderboardPage

