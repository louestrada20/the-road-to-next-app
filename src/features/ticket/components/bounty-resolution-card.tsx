"use client"

import { useActionState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { approveBountyPayment } from "@/features/ticket/actions/approve-bounty-payment"
import { TicketWithMetaData } from "@/features/ticket/types/types"
import { fromCent } from "@/utils/currency"

type BountyResolutionCardProps = {
    ticket: TicketWithMetaData
}

export const BountyResolutionCard = ({ ticket }: BountyResolutionCardProps) => {
    const [actionState, action] = useActionState(
        approveBountyPayment.bind(null, ticket.id),
        EMPTY_ACTION_STATE
    )

    // Only show if ticket is marked as DONE and has a solver
    if (ticket.status !== 'DONE' || !ticket.solvedBy) {
        return null
    }

    const solverName = ticket.solvedBy.firstName && ticket.solvedBy.lastName
        ? `${ticket.solvedBy.firstName} ${ticket.solvedBy.lastName}`
        : ticket.solvedBy.username

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Resolution</span>
                    {ticket.bountyApproved && ticket.bountyPaidAt && (
                        <Badge variant="default" className="bg-green-600">
                            ✓ Bounty Paid
                        </Badge>
                    )}
                    {!ticket.bountyApproved && (
                        <Badge variant="secondary">
                            Pending Approval
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Solved by:</span>
                        <span className="font-medium">{solverName}</span>
                    </div>
                    {ticket.solvedAt && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Solved at:</span>
                            <span className="font-medium">
                                {new Date(ticket.solvedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bounty:</span>
                        <span className="font-semibold text-lg">{fromCent(ticket.bounty)}</span>
                    </div>
                </div>

                {!ticket.bountyApproved && ticket.isOwner && (
                    <>
                        <Separator />
                        <form action={action}>
                            <SubmitButton 
                                label="Approve Bounty Payment" 
                                className="w-full"
                            />
                            {actionState.status === 'ERROR' && (
                                <p className="text-sm text-red-600 mt-2">
                                    {actionState.message}
                                </p>
                            )}
                        </form>
                    </>
                )}

                {ticket.bountyPaidAt && (
                    <>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                            Approved on {new Date(ticket.bountyPaidAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

