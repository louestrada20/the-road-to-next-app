import {getTicket} from "@/features/ticket/queries/get-ticket";
import { ticketsPath } from "@/paths";  
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";
import { limitIp } from "@/lib/rate-limit"; 
import { hashToken } from "@/utils/crypto"; 
import { revalidatePath } from "next/cache";          

export async function GET(_request: Request, { params }: { params: Promise<{ticketId: string}>}) {
    const ip = await getClientIp();
    const res = await limitIp(ip, "tickets", 100, "1 m");   
    if (!res.success) {
        return new Response("Too many requests", {status: 429});
    }

    const {ticketId} = await params;
    const ticket = await getTicket(ticketId);

    return Response.json(ticket);
};


export async function DELETE(
    {headers}: Request,
    {params}: {params: Promise<{ticketId: string}>}
) {
    const ip = await getClientIp();
    const res = await limitIp(ip, "tickets", 100, "1 m");   
    if (!res.success) {
        return new Response("Too many requests", {status: 429});
    }
    const {ticketId} = await params;
    
    const bearerToken = new Headers(headers).get("Authorization");
    const authToken = (bearerToken || "").split("Bearer ").at(1);

    if (!authToken) {
        return Response.json({error: "Not Authorized"}, {status: 401});
    }

    const hashedToken = hashToken(authToken);

    const ticket = await prisma.ticket.findUnique({
        where: {
            id: ticketId,
        }
    });

    if (!ticket) {
        return Response.json({error: "Ticket not found"}, {status: 404});
    }

    const credential = await prisma.credential.findUnique({
        where: {
            secretHash: hashedToken,
            organizationId: ticket.organizationId,  
        }
    })

    if (!credential) {
        return Response.json({error: "Not Authorized"}, {status: 401});
    }



    await prisma.$transaction([
         prisma.ticket.delete({    
            where: {id: ticketId},
        }),
    
         prisma.credential.update({
            where: {
                id: credential.id,
            },
            data: {
                lastUsed: new Date(),
            }
        })
    ]);

    revalidatePath(ticketsPath());


    return Response.json({ticketId})
}
