import {Placeholder} from "@/components/placeholder";
import {TicketItem} from "@/features/ticket/components/ticket-item";
import {TicketPagination} from "@/features/ticket/components/ticket-pagination";
import {TicketSearchInput} from "@/features/ticket/components/ticket-search-input";
import {TicketSortSelect} from "@/features/ticket/components/ticket-sort-select";
import {getTickets} from "@/features/ticket/queries/get-tickets";
import {ParsedSearchParams} from "@/features/ticket/search-params";

type TicketListProps = {
    userId?: string;
    searchParams: ParsedSearchParams;
}

const ticketSortSelectOptions = [
    {
        sortKey: "createdAt",
        sortValue: "desc",
        label: "Newest",
    },
    {
        sortKey: "createdAt",
        sortValue: "asc",
        label: "Oldest",
    },
    {
        sortKey: "bounty",
        sortValue: "desc",
        label: "Bounty",
    },
    {
        sortKey: "title",
        sortValue: "asc",
        label: "Title",
    },
];

 const TicketList = async ({userId, searchParams}: TicketListProps) => {
    const {list: tickets, metadata: ticketMetaData } = await getTickets(userId, searchParams);


    return (
        <div className="flex-1 flex flex-col items-center gap-y-4 animate-fade-in-from-top">
            <div className="max-w-[420px] w-full flex gap-x-2">
                <TicketSearchInput placeholder="Search tickets..." />
                <TicketSortSelect
                    options={ticketSortSelectOptions}
                />
            </div>
            {tickets.length ? (
                tickets.map((ticket) => <TicketItem ticket={ticket} key={ticket.id}/>)
            ) : <Placeholder label="No tickets found..." />
            }

            <div className="max-w-[420px] w-full">
                <TicketPagination paginatedTicketMetadata={ticketMetaData} />
            </div>
        </div>
    )
}

export {TicketList}