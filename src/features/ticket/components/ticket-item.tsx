
import {Ticket} from "@prisma/client";
import clsx from "clsx";
import {LucideMoreVertical, LucidePencil, LucideSquareArrowOutUpRight} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {TicketMoreMenu} from "@/features/ticket/components/ticket-more-menu";
import {TICKET_ICONS} from "@/features/ticket/constants";
import {ticketEditPath, ticketPath} from "@/paths";
import {toCurrencyFromCent} from "@/utils/currency";


type TicketItemProps = {
ticket: Ticket
    isDetail?: boolean
};

const TicketItem = async ({ticket, isDetail}: TicketItemProps) => {

    const editButton = ( <Button asChild variant="outline" size="icon">
            <Link prefetch href={ticketEditPath(ticket.id)}>
            <LucidePencil className="h-4 w-4" />
            </Link>
        </Button>

    )

    const detailButton = (  <Button variant="outline" asChild size="icon">
            <Link prefetch href={ticketPath(ticket.id)} className="">
                <LucideSquareArrowOutUpRight className="h-4 w-4"/>
            </Link>
    </Button>
    );






    const moreMenu = <TicketMoreMenu ticket={ticket} trigger={
        <Button variant="outline" size="icon">
        <LucideMoreVertical className="h-4 w-4" />
    </Button>
    }
    />;

    return (
        <div className={clsx('w-full  flex gap-x-1', {
            "max-w-[580px]": isDetail,
            "max-w-[420px]": !isDetail,
        })}>
            <Card className="w-full "
            >
                <CardHeader>
                    <CardTitle className="flex gap-x-2">
                        <span>{TICKET_ICONS[ticket.status]}</span>
                        <span className="truncate ">{ticket.title}</span>
                    </CardTitle>
                </CardHeader>


                <CardContent>
                <span className={clsx("whitespace-break-spaces", {
                    "line-clamp-3": !isDetail
                })}>{ticket.content}</span>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <p className="text-sm text-muted-foreground">{ticket.deadline}</p>
                    <p className="text-sm text-muted-foreground">{toCurrencyFromCent(ticket.bounty)}</p>
                </CardFooter>
            </Card>
            <div className="flex flex-col gap-y-1">
            {isDetail ?
                <>
                    {editButton}

                    {moreMenu}
                </>
                :
                <>
                    {detailButton}
                    {editButton}
                </>
            }
            </div>
        </div>
    )
};
export {TicketItem}