"use client"

import clsx from "clsx";
import {LucideMoreVertical, LucidePencil, LucideSquareArrowOutUpRight} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {TicketMoreMenu} from "@/features/ticket/components/ticket-more-menu";
import {TICKET_ICONS} from "@/features/ticket/constants";
import {TicketWithMetaData} from "@/features/ticket/types/types";
import {ticketEditPath, ticketPath} from "@/paths";
import {toCurrencyFromCent} from "@/utils/currency";


type TicketItemProps = {
    ticket: TicketWithMetaData,
    isDetail?: boolean,
    attachments?: React.ReactNode,
    comments?: React.ReactNode;
    referencedTickets?: React.ReactNode;
};

const TicketItem = ({ticket, isDetail, attachments, comments, referencedTickets}: TicketItemProps) => {

// const {user} = await getAuth();
// const isTicketOwner = isOwner(user, ticket);



    const renderEditButton = () => {
        if (ticket.isOwner && ticket.permissions.canUpdateTicket) {
            return (
                <Button asChild variant="outline" size="icon">
                    <Link prefetch href={ticketEditPath(ticket.id)}>
                        <LucidePencil className="h-4 w-4" />
                    </Link>
                </Button>
            );
        }

        if (ticket.isOwner && !ticket.permissions.canUpdateTicket) {
            // Show disabled edit button with tooltip
            const disabledEditButton = (
                <Button variant="outline" size="icon" disabled className="cursor-not-allowed opacity-50">
                    <LucidePencil className="h-4 w-4" />
                </Button>
            );

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {disabledEditButton}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>You do not have permission to update this ticket.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return null;
    };


    const detailButton = (  <Button variant="outline" asChild size="icon">
            <Link prefetch href={ticketPath(ticket.id)} className="">
                <LucideSquareArrowOutUpRight className="h-4 w-4"/>
            </Link>
    </Button>
    );

    const renderMoreMenu = () => {
        if (!ticket.isOwner) {
            return null;
        }

        // Always show more menu for ticket owners (contains status options)
        // Individual actions inside will be disabled based on permissions
        return (
            <TicketMoreMenu ticket={ticket} trigger={
                <Button variant="outline" size="icon">
                    <LucideMoreVertical className="h-4 w-4" />
                </Button>
            } />
        );
    };



    return (
        <div className={clsx('w-full  flex flex-col gap-y-4', {
            "max-w-[580px]": isDetail,
            "max-w-[420px]": !isDetail,
        })}>
        <div className="flex gap-x-2">
            <Card className="w-full "
            >
                <CardHeader>
                    <CardTitle className="flex gap-x-2">
                        <span>{TICKET_ICONS[ticket.status]}</span>
                        <span className="truncate ">{ticket.title} </span>
                    </CardTitle>
                </CardHeader>


                <CardContent>
                <span className={clsx("whitespace-break-spaces", {
                    "line-clamp-3": !isDetail
                })}>{ticket.content}</span>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <p className="text-sm text-muted-foreground">{ticket.deadline} by {ticket.user.username}</p>
                    <p className="text-sm text-muted-foreground">{toCurrencyFromCent(ticket.bounty)}</p>
                </CardFooter>
            </Card>
            <div className="flex flex-col gap-y-1">
            {isDetail ?
                <>
                    {renderEditButton()}
                    {renderMoreMenu()}
                </>
                :
                <>
                    {detailButton}
                    {renderEditButton()}
                </>
            }
            </div>

        </div>

            {attachments}
            {referencedTickets}
            {comments}
        </div>
    )
};
export {TicketItem}