"use client"
import { TicketStatus} from "@prisma/client";
import { LucideTrash} from "lucide-react";
import {toast} from "sonner"
import {useConfirmDialog} from "@/components/confirm-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {deleteTicket} from "@/features/ticket/actions/delete-ticket";
import {updateTicketStatus} from "@/features/ticket/actions/update-ticket-status";
import {TICKET_STATUS_LABELS} from "@/features/ticket/constants";
import {TicketWithMetaData} from "@/features/ticket/types/types";

type TicketMoreMenuProps = {
    ticket: TicketWithMetaData;
    trigger: React.ReactNode
}
const TicketMoreMenu = ({ticket, trigger}: TicketMoreMenuProps) => {

    const [deleteButton, deleteDialog ] = useConfirmDialog(
        {
            action: deleteTicket.bind(null, ticket.id),
            trigger: ( <DropdownMenuItem disabled={!ticket.permissions.canDeleteTicket} className="cursor-pointer">
                    <LucideTrash className=" h-4 w-4"/>
                    <span>Delete</span>
            </DropdownMenuItem>),
            title: "Are you absolutely sure?",
            description: "This action cannot be undone. Make sure you understand the consequences."
        }

    );

    const handleUpdateTicketStatus = async (value: string) => {

       const promise  = updateTicketStatus(ticket.id, value as TicketStatus);
        toast.promise(promise, {
            loading: "Updating Ticket Status...",
            }
        )
       const result = await promise;
       if (result.status === "ERROR") {
        toast.error(result.message);
       } else {
           toast.success(result.message);
       }
    }

    const ticketStatusRadioGroupItems = (
        <DropdownMenuRadioGroup  value={ticket.status} onValueChange={handleUpdateTicketStatus}>
            {(Object.keys(TICKET_STATUS_LABELS)as Array<TicketStatus>).map(key => (
                <DropdownMenuRadioItem className="cursor-pointer" key={key} value={key}>{TICKET_STATUS_LABELS[key]}</DropdownMenuRadioItem>
            ))}
        </DropdownMenuRadioGroup>
    )



    const renderDeleteButton = () => {
        if (ticket.permissions.canDeleteTicket) {
            return deleteButton;
        }

        // Create a non-disabled version of the delete button for the tooltip
        const disabledDeleteButton = (
            <DropdownMenuItem className="cursor-not-allowed opacity-50">
                <LucideTrash className="h-4 w-4"/>
                <span>Delete</span>
            </DropdownMenuItem>
        );

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {disabledDeleteButton}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>You do not have permission to delete this ticket.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };
    return (
        <>
            {deleteDialog}

            <DropdownMenu >
                <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 " side="right">
                    {ticketStatusRadioGroupItems}
                    <DropdownMenuSeparator />
                    {renderDeleteButton()}
                </DropdownMenuContent>
            </DropdownMenu>
        </>

    )
}

export {TicketMoreMenu}
