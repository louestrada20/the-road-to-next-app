
import {SearchParams} from "nuqs/server";
import {Suspense} from "react";
import {getCookieByKey} from "@/actions/cookies";
import {CardCompact} from "@/components/card-compact";
import {Heading} from "@/components/heading";
import {Spinner} from "@/components/spinner";
import {getAuth} from "@/features/auth/actions/get-auth";
import {getActiveOrganization} from "@/features/organization/queries/get-active-organization";
import {TicketList} from "@/features/ticket/components/ticket-list";
import {TicketSwitchView} from "@/features/ticket/components/ticket-switch-view";
import {TicketUpsertForm} from "@/features/ticket/components/ticket-upsert-form";
import {searchParamsCache} from "@/features/ticket/search-params";

// export const revalidate = 30;

type TicketPageProps = {
    searchParams: Promise<SearchParams>;
}

const TicketsPage =  async ({searchParams}: TicketPageProps) => {
    const {user} =  await getAuth();
    const activeOrganization = await getActiveOrganization();
    const ticketView = await getCookieByKey("ticket-view")

    const activeOrganizationTickets = ticketView === "active-organization-tickets";

    return (
        <>
        <div className="flex-1 flex flex-col gap-y-8">
        <Heading title="My Tickets" description="You can toggle between your active organization's tickets, or all of your tickets"  actions={
            <TicketSwitchView activeOrganizationName={activeOrganization!.name} initialTickets={activeOrganizationTickets} />
        } />

           <CardCompact className="w-full max-w-[420px] self-center" title="Create Ticket" description="A new ticket will be created" content={<TicketUpsertForm />} />
            <Suspense fallback={<Spinner/>}>
            <TicketList userId={user?.id} byOrganization={activeOrganizationTickets} searchParams={searchParamsCache.parse(await searchParams)} />
            </Suspense>
        </div>
        </>
    )
}

export default TicketsPage;