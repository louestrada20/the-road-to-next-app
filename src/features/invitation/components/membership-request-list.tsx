"use client"

import { LucideCheck, LucideExternalLink, LucideX } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { createInvitation } from "@/features/invitation/actions/create-invitation"
import { deleteInvitation } from "@/features/invitation/actions/delete-invitation"
import { ticketPath } from "@/paths"
import { fromCent } from "@/utils/currency"

type MembershipRequest = {
    email: string
    createdAt: Date
    requestedFromTicket: {
        id: string
        title: string
        bounty: number
    } | null
}

type MembershipRequestListProps = {
    requests: MembershipRequest[]
    organizationId: string
}

const MembershipRequestItem = ({ 
    request, 
    organizationId 
}: { 
    request: MembershipRequest
    organizationId: string
}) => {
    // Approve = delete REQUESTED invitation, create PENDING invitation (triggers email)
    const handleApprove = async (_prevState: unknown, formData: FormData) => {
        // First delete the request
        await deleteInvitation({ organizationId, email: request.email })
        // Then create standard invitation (sends email)
        return createInvitation(organizationId, EMPTY_ACTION_STATE, formData)
    }

    const [approveState, approveAction] = useActionState(
        handleApprove,
        EMPTY_ACTION_STATE
    )

    const [denyState, denyAction] = useActionState(
        async () => deleteInvitation({ organizationId, email: request.email }),
        EMPTY_ACTION_STATE
    )

    return (
        <TableRow>
            <TableCell>{request.email}</TableCell>
            <TableCell>
                {request.requestedFromTicket ? (
                    <Link 
                        href={ticketPath(request.requestedFromTicket.id)}
                        className="flex items-center gap-x-1 text-sm hover:underline"
                    >
                        <span>{request.requestedFromTicket.title}</span>
                        <LucideExternalLink className="h-3 w-3" />
                    </Link>
                ) : (
                    <span className="text-sm text-muted-foreground">Direct request</span>
                )}
                {request.requestedFromTicket && (
                    <div className="text-xs text-muted-foreground mt-1">
                        Bounty: {fromCent(request.requestedFromTicket.bounty)}
                    </div>
                )}
            </TableCell>
            <TableCell>
                <div className="text-sm text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex gap-x-2">
                    <form action={approveAction}>
                        <input type="hidden" name="email" value={request.email} />
                        <SubmitButton 
                            label="Approve & Invite"
                            size="sm"
                            icon={<LucideCheck className="h-4 w-4" />}
                        />
                    </form>
                    <form action={denyAction}>
                        <Button variant="outline" size="sm" type="submit">
                            <LucideX className="h-4 w-4 mr-1" />
                            Deny
                        </Button>
                    </form>
                </div>
                {(approveState.status === 'ERROR' || denyState.status === 'ERROR') && (
                    <p className="text-sm text-red-600 mt-1">
                        {approveState.message || denyState.message}
                    </p>
                )}
            </TableCell>
        </TableRow>
    )
}

export const MembershipRequestList = ({ requests, organizationId }: MembershipRequestListProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>From Ticket</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((request) => (
                    <MembershipRequestItem 
                        key={request.email} 
                        request={request} 
                        organizationId={organizationId}
                    />
                ))}
            </TableBody>
        </Table>
    )
}

