"use client"

import { LucideGlobe } from "lucide-react"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requestTicketPublic } from "@/features/ticket/actions/request-ticket-public"

type PublicRequestButtonProps = {
    ticketId: string
    isOwner: boolean
    isPublic: boolean
    publicRequestedAt: Date | null
}

export const PublicRequestButton = ({ 
    ticketId, 
    isOwner, 
    isPublic, 
    publicRequestedAt 
}: PublicRequestButtonProps) => {
    const handleRequest = async () => {
        return requestTicketPublic(ticketId)
    }

    const [requestButton, requestDialog] = useConfirmDialog({
        action: handleRequest,
        trigger: (
            <Button variant="secondary" size="sm">
                <LucideGlobe className="h-4 w-4 mr-1" />
                Request to Make Public
            </Button>
        ),
        title: "Request Public Visibility?",
        description: "This will notify organization admins to review your request. If approved, this ticket will become publicly visible and CANNOT be made private again. Make sure there is no sensitive information in this ticket."
    })

    // Only show for ticket owners
    if (!isOwner) {
        return null
    }

    // Show public badge if already public
    if (isPublic) {
        return (
            <Badge variant="default" className="bg-blue-600">
                <LucideGlobe className="h-3 w-3 mr-1" />
                Public
            </Badge>
        )
    }

    // Show pending badge if requested
    if (publicRequestedAt) {
        return (
            <Badge variant="secondary">
                <LucideGlobe className="h-3 w-3 mr-1" />
                Public Request Pending
            </Badge>
        )
    }

    // Show request button
    return (
        <>
            {requestButton}
            {requestDialog}
        </>
    )
}

