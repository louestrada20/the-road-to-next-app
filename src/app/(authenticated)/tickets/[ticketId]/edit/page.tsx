
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/breadcrumbs";
import {CardCompact} from "@/components/card-compact";
import {Separator} from "@/components/ui/separator";
import {TicketUpsertForm} from "@/features/ticket/components/ticket-upsert-form";
import {getTicket} from "@/features/ticket/queries/get-ticket";
import {homePath, ticketPath} from "@/paths";

type TicketEditPageProps = {
    params: Promise<{
        ticketId: string;
    }>
}

const TicketEditPage = async ({params}: TicketEditPageProps) => {
   const {ticketId} = await params;
   const ticket = await getTicket(ticketId);

   const isTicketFound = !!ticket;


   if (!isTicketFound || !ticket.isOwner) {
       notFound();
   }
    return (
        <div className=" flex-1 flex flex-col gap-y-8">
            <Breadcrumbs breadcrumbs={[
                {title: "Home", href: homePath()},
                {title: ticket.title, href: ticketPath(ticketId)},
                {title: "Edit"}
            ]} />
            <Separator />

        <div className="flex flex-col flex-1 justify-center items-center ">
            <CardCompact title="Edit Ticket" description="Edit an existing ticket" content={<TicketUpsertForm ticket={ticket} />} className="w-full max-w-[420px] animate-fade-in-from-top"  />
        </div>
        </div>
    )
}

export default TicketEditPage;