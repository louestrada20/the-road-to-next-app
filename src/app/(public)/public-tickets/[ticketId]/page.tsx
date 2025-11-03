import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getAuth } from "@/features/auth/actions/get-auth"
import { TicketViewTracker } from "@/features/ticket/components/ticket-view-tracker"
import { TICKET_ICONS } from "@/features/ticket/constants"
import { getPublicTicket } from "@/features/ticket/queries/get-public-ticket"
import { homePath, publicTicketsPath, signInPath, signUpPath } from "@/paths"

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'

type PublicTicketPageProps = {
    params: Promise<{
        ticketId: string
    }>
}

const PublicTicketPage = async ({ params }: PublicTicketPageProps) => {
    const { ticketId } = await params
    const ticket = await getPublicTicket(ticketId)
    const { user } = await getAuth()

    if (!ticket) {
        notFound()
    }

    // Check if user is already a member of this organization
    let isMember = false
    if (user) {
        const membership = await import("@/lib/prisma").then(m => m.prisma.membership.findFirst({
            where: {
                organizationId: ticket.organization.id,
                userId: user.id
            }
        }))
        isMember = !!membership
    }

    const creatorName = ticket.user?.firstName && ticket.user?.lastName
        ? `${ticket.user.firstName} ${ticket.user.lastName}`
        : ticket.user?.username || 'Unknown'

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <TicketViewTracker 
                ticketId={ticket.id} 
                organizationId={ticket.organization.id}
                userId={user?.id}
            />
            <Breadcrumbs
                breadcrumbs={[
                    { title: "Home", href: homePath() },
                    { title: "Public Tickets", href: publicTicketsPath() },
                    { title: ticket.title }
                ]}
            />
            <Separator />
            
            <div className="flex justify-center">
                <div className="w-full max-w-[580px] flex flex-col gap-y-4">
                    {/* Read-only banner */}
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <CardContent className="py-4">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                📖 This is a public ticket (read-only). 
                                {!isMember && " Join the organization to help solve it and earn the bounty."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Ticket card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex gap-x-2">
                                <span>{TICKET_ICONS[ticket.status]}</span>
                                <span className="truncate">{ticket.title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="whitespace-break-spaces">{ticket.content}</p>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Organization:</span>
                                    <p className="font-medium">{ticket.organization.name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Created by:</span>
                                    <p className="font-medium">{creatorName}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Deadline:</span>
                                    <p className="font-medium">{ticket.deadline}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Bounty:</span>
                                    <p className="text-2xl font-bold text-green-600">{ticket.bountyFormatted}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant="secondary">{ticket.status}</Badge>
                                </div>
                                {ticket.status === 'DONE' && ticket.solvedBy && (
                                    <div>
                                        <span className="text-muted-foreground">Solved by:</span>
                                        <p className="font-medium">{ticket.solvedBy.username}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-y-2">
                            {isMember ? (
                                <p className="text-sm text-muted-foreground text-center w-full">
                                    You are already a member of this organization.{" "}
                                    <Link href={signInPath()} className="underline">
                                        Sign in
                                    </Link>{" "}
                                    to access the full ticket.
                                </p>
                            ) : user ? (
                                <Button asChild className="w-full">
                                    <Link href={`${publicTicketsPath()}/${ticketId}/request-membership`}>
                                        Request to Join Organization
                                    </Link>
                                </Button>
                            ) : (
                                <div className="w-full space-y-2">
                                    <Button asChild className="w-full">
                                        <Link href={signUpPath()}>
                                            Sign Up to Solve & Earn
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href={signInPath()}>
                                            Already have an account? Sign In
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default PublicTicketPage

