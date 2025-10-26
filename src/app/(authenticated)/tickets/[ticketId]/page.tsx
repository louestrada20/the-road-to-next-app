
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/breadcrumbs";
import {Separator} from "@/components/ui/separator";
import {Attachments} from "@/features/attachments/components/attachments";
import {Comments} from "@/features/comment/components/comments/comments";   
import {getComments} from "@/features/comment/queries/get-comments";
import {BountyResolutionCard} from "@/features/ticket/components/bounty-resolution-card";
import {TicketItem} from "@/features/ticket/components/ticket-item";
import {TicketReferences} from "@/features/ticket/components/ticket-references";
import {getTicket} from "@/features/ticket/queries/get-ticket";
import {homePath} from "@/paths";

type TicketPageProps = {
    params: Promise <{
        ticketId: string;
    }>
};
const TicketPage = async ({params}: TicketPageProps) => {
    const { ticketId } = await params;
    const results = await Promise.allSettled([
        getTicket(ticketId),
        getComments(ticketId),
    ]);
    // await both ticket and comments concurrently for faster response time
    //using all settled, so if one fails the other can still be used.
    const ticket = results[0].status === "fulfilled" ? results[0].value : null;
    const paginatedComments = results[1].status === "fulfilled"
        ? results[1].value
        : { list: [], metadata: { count: 0, hasNextPage: false } };
   if (!ticket)  {
    notFound();
   }

    return (
        <div className=" flex-1 flex flex-col gap-y-8">
            <Breadcrumbs breadcrumbs={[
                {title: "Home", href: homePath()},
                {title: ticket.title}
            ]} />
            <Separator />
        <div className="flex animate-fade-in-from-top justify-center">
           <TicketItem ticket={ticket}
                       isDetail
                       bountyResolution={<BountyResolutionCard ticket={ticket} />}
                       attachments={
                            <Attachments entityId={ticket.id} entity="TICKET" isOwner={ticket.isOwner} />
                       }
                       referencedTickets={<TicketReferences ticketId={ticket.id} />}
                       comments={
                            <Comments ticketId={ticket.id} paginatedComments={paginatedComments} />
                       }
           />
        </div>


        </div>
    )
}

// commented them out because it makes more sense to just keep these dynamic as we WANT a highly dynamic app.
// but keeping here to know how we generate static pages for dynamic [ticketId] pages (assuming we know all the id's beforehand and there is not too many).

// export async function generateStaticParams() {
//     const tickets = await getTickets();
//
//     return tickets.map((ticket) => ({
//         ticketId: ticket.id,
//     }))
// }
export default TicketPage;