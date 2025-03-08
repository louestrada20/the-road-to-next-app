import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

const tickets = [
    {
        title: "Ticket 1",
        content: "This is the first ticket from the database",
        status: "OPEN" as const,
        bounty: 499,
        deadline: new Date().toISOString().split("T")[0],
    },
    {
        title: "Ticket 2",
        content: "This is the second ticket from the database",
        status: "IN_PROGRESS" as const,
        bounty: 399,
        deadline: new Date().toISOString().split("T")[0],
    },
    {
        title: "Ticket 3",
        content: "This is the third ticket from the database",
        status: "DONE" as const,
        bounty: 599,
        deadline: new Date().toISOString().split("T")[0],
    }
]

const seed = async () => {
    const t0 = performance.now();
    console.log('DB Seed: Started...')

    // for (const ticket of tickets) {
    //     await prisma.ticket.create({
    //         data: ticket,
    //     })
    // }
    // const promises = tickets.map((ticket) => prisma.ticket.create({
    //     data: ticket
    // }))
    // await Promise.all(promises);

    // Delete current tickets in DB first.
    await prisma.ticket.deleteMany();
    // Create tickets in our DB.
    await prisma.ticket.createMany({
        data: tickets,
    });

    const t1 = performance.now();
    console.log(`DB Seed: Finished (${t1 - t0}ms)`)
}

seed();