
import {notFound} from "next/navigation";
import {TicketItem} from "@/features/ticket/components/ticket-item";
import {getTicket} from "@/features/ticket/queries/get-ticket";


type TicketPageProps = {
    params: Promise <{
        ticketId: string;
    }>
};

const TicketPage = async ({params}: TicketPageProps) => {
   const {ticketId} = await params;
    const ticket = await getTicket(ticketId);

   if (!ticket)  {
    notFound();
   }

    return (
        <>
        <div className="flex animate-fade-in-from-top justify-center">
           <TicketItem ticket={ticket} isDetail />
        </div>

        </>
    )
}

// commented them out because it makes more sense to just keep these dynamic as we WANT a highly dynamic app.
// but keeping here to know how we generate static pages for dynamic [ticketId] pages (assuming we know all the id's beforehand and there is no too many).

// export async function generateStaticParams() {
//     const tickets = await getTickets();
//
//     return tickets.map((ticket) => ({
//         ticketId: ticket.id,
//     }))
// }
export default TicketPage;