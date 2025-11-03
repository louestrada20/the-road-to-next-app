"use client"

import { LucideCheck, LucideX } from "lucide-react"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { approveTicketPublic } from "@/features/ticket/actions/approve-ticket-public"
import { denyTicketPublic } from "@/features/ticket/actions/deny-ticket-public"

type PublicRequest = {
    id: string
    title: string
    content: string
    bountyFormatted: string
    status: string
    publicRequestedAt: Date | null
    publicRequestedByUser: {
        username: string
        firstName: string | null
        lastName: string | null
    } | null
}

type PublicRequestListProps = {
    requests: PublicRequest[]
    organizationId: string
}

const PublicRequestItem = ({ request, organizationId }: { request: PublicRequest; organizationId: string }) => {
    const handleApprove = async () => {
        return approveTicketPublic(request.id, organizationId)
    }

    const handleDeny = async () => {
        return denyTicketPublic(request.id, organizationId)
    }

    const [approveButton, approveDialog] = useConfirmDialog({
        action: handleApprove,
        trigger: (
            <Button variant="default" size="sm">
                <LucideCheck className="h-4 w-4 mr-1" />
                Approve
            </Button>
        ),
        title: "Make Ticket Public?",
        description: "This action is IRREVERSIBLE. Once public, this ticket will be visible to anyone on the internet and cannot be made private again. The only option to hide sensitive information is to delete the ticket entirely. Are you absolutely sure?",
        loadingMessage: "Approving request..."
    })

    const [denyButton, denyDialog] = useConfirmDialog({
        action: handleDeny,
        trigger: (
            <Button variant="outline" size="sm">
                <LucideX className="h-4 w-4 mr-1" />
                Deny
            </Button>
        ),
        title: "Deny Public Request?",
        description: "The user will not be notified of the denial.",
        loadingMessage: "Denying request..."
    })

    const requesterName = request.publicRequestedByUser
        ? request.publicRequestedByUser.firstName && request.publicRequestedByUser.lastName
            ? `${request.publicRequestedByUser.firstName} ${request.publicRequestedByUser.lastName}`
            : request.publicRequestedByUser.username
        : 'Unknown'

    return (
        <>
            <TableRow>
                <TableCell>
                    <div className="space-y-1">
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                            {request.content}
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">{request.status}</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                    {request.bountyFormatted}
                </TableCell>
                <TableCell>
                    <div className="text-sm">
                        <div>{requesterName}</div>
                        {request.publicRequestedAt && (
                            <div className="text-xs text-muted-foreground">
                                {new Date(request.publicRequestedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex gap-x-2">
                        {approveButton}
                        {denyButton}
                    </div>
                </TableCell>
            </TableRow>
            {approveDialog}
            {denyDialog}
        </>
    )
}

export const PublicRequestList = ({ requests, organizationId }: PublicRequestListProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bounty</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((request) => (
                    <PublicRequestItem 
                        key={request.id} 
                        request={request} 
                        organizationId={organizationId}
                    />
                ))}
            </TableBody>
        </Table>
    )
}

