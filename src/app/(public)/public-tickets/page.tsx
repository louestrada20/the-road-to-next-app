import Link from "next/link"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Heading } from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getPublicTickets } from "@/features/ticket/queries/get-public-tickets"
import { homePath, publicTicketPath, signUpPath } from "@/paths"

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'

const PublicTicketsPage = async () => {
    const { list: tickets, metadata } = await getPublicTickets({
        page: 0,
        size: 25,
        sortBy: 'bounty',
        sortOrder: 'desc'
    })

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <Breadcrumbs
                breadcrumbs={[
                    { title: "Home", href: homePath() },
                    { title: "Public Tickets" }
                ]}
            />
            <Separator />
            
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <Heading
                        title="🎯 Public Bounty Marketplace"
                        description="Solve tickets, earn bounties. Join organizations to start helping."
                    />
                    <div className="flex justify-center gap-x-4 text-sm text-muted-foreground">
                        <div>
                            <span className="font-semibold">{metadata.count}</span> open tickets
                        </div>
                    </div>
                </div>

                {tickets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <p className="text-center text-muted-foreground">
                                No public tickets available at the moment.
                            </p>
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                Check back later or{" "}
                                <Link href={signUpPath()} className="underline">
                                    sign up
                                </Link>{" "}
                                to create your own.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tickets.map((ticket) => (
                            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="truncate">{ticket.title}</span>
                                        <Badge variant="default" className="ml-2 bg-green-600">
                                            {ticket.bountyFormatted}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {ticket.content}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{ticket.organization.name}</span>
                                        <span>Due: {ticket.deadline}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href={publicTicketPath(ticket.id)}>
                                            View Details
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PublicTicketsPage

