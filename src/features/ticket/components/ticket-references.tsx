import { LucideArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ticketPath } from "@/paths";
import { getReferencedTickets } from "../queries/get-referenced-tickets";
import { getReferencingTickets } from "../queries/get-referencing-tickets";

type TicketReferencesProps = {
    ticketId: string;
};

const TicketReferences = async ({ ticketId }: TicketReferencesProps) => {
    // Fetch both referenced and referencing tickets concurrently
    const [referencedTickets, referencingTickets] = await Promise.all([
        getReferencedTickets(ticketId),
        getReferencingTickets(ticketId),
    ]);

    const hasReferencedTickets = referencedTickets.length > 0;
    const hasReferencingTickets = referencingTickets.length > 0;

    // Return null if no tickets to display
    if (!hasReferencedTickets && !hasReferencingTickets) {
        return null;
    }

    // Helper function to render ticket links
    const renderTicketList = (tickets: typeof referencedTickets) => (
        <div className="mx-2 mb-2">
            {tickets.map((ticket) => (
                <div key={ticket.id}>
                    <Link
                        className="flex gap-x-2 items-center text-sm"
                        href={ticketPath(ticket.id)}
                    >
                        <LucideArrowUpRightFromSquare className="w-4 h-4" />
                        {ticket.title}
                    </Link>
                </div>
            ))}
        </div>
    );

    // Single tab scenarios
    if (hasReferencedTickets && !hasReferencingTickets) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Referenced Tickets</CardTitle>
                    <CardDescription>Tickets that have been referenced in comments</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTicketList(referencedTickets)}
                </CardContent>
            </Card>
        );
    }

    if (!hasReferencedTickets && hasReferencingTickets) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Referencing Tickets</CardTitle>
                    <CardDescription>Tickets that reference this ticket in their comments</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTicketList(referencingTickets)}
                </CardContent>
            </Card>
        );
    }

    // Both exist - render tabbed interface
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ticket References</CardTitle>
                <CardDescription>Related tickets and cross-references</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="referenced" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="referenced">Referenced Tickets</TabsTrigger>
                        <TabsTrigger value="referencing">Referencing Tickets</TabsTrigger>
                    </TabsList>
                    <TabsContent value="referenced" className="mt-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Tickets that have been referenced in comments
                        </div>
                        {renderTicketList(referencedTickets)}
                    </TabsContent>
                    <TabsContent value="referencing" className="mt-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Tickets that reference this ticket in their comments
                        </div>
                        {renderTicketList(referencingTickets)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export { TicketReferences };

