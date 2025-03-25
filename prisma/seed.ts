import {PrismaClient} from "@prisma/client";
import {hashPassword} from "@/features/auth/password";

const prisma = new PrismaClient();

const users = [
    {
        username: "admin",
        email: "admin@admin.com",
        firstName: "adminFirstName",
        lastName: "adminLastName",
    },
    {
        username: "Louis",
        email: "louestrada31@gmail.com",
        firstName: "Louis",
        lastName: "EstLastName",
    }
]

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



const comments = [
    [
        { content: "First comment on ticket 1" },
        { content: "Second comment on ticket 1" },
        { content: "Third comment on ticket 1" },
        { content: "Fourth comment on ticket 1" },
        { content: "Fifth comment on ticket 1" },
        { content: "Sixth comment on ticket 1" },
        { content: "Seventh comment on ticket 1" },
        { content: "Eighth comment on ticket 1" },
        { content: "Ninth comment on ticket 1" },
        { content: "Tenth comment on ticket 1" },
    ],
    [
        { content: "Single comment for ticket 2" }
    ],
    [
        { content: "Single comment for ticket 3" }
    ]
];

const seed = async () => {
    const t0 = performance.now();
    console.log('DB Seed: Started...')


    const passwordHash = await hashPassword("geheimnis");
    // Delete current tickets and users in DB first.
    await prisma.user.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.comment.deleteMany();


    // recreate them.
    const dbUsers = await prisma.user.createManyAndReturn({
        data: users.map((user) => ({
            ...user,
             passwordHash,
        })),
    });

    const dbTickets = await prisma.ticket.createManyAndReturn({
        data: tickets.map((ticket) => ({
            ...ticket,
            userId: dbUsers[0].id,
        }))
    });

    await prisma.comment.createMany({
        data: comments.flatMap((commentGroup, ticketIndex) =>
            commentGroup.map((comment) => ({
                ...comment,
                userId: dbUsers[0].id,
                ticketId: dbTickets[ticketIndex].id,
            }))
        )
    });


    const t1 = performance.now();
    console.log(`DB Seed: Finished (${t1 - t0}ms)`)
}

seed();