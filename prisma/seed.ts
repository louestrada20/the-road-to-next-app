import {PrismaClient} from "@prisma/client";
import {hashPassword} from "@/features/auth/password";

const prisma = new PrismaClient();

const users = [
    {
        username: "admin",
        email: "admin@admin.com",
        firstName: "adminFirstName",
        lastName: "adminLastName",
        emailVerified: true,
    },
    {
        username: "Louis",
        email: "louestrada31@gmail.com",
        firstName: "Louis",
        lastName: "EstLastName",
        emailVerified: true,
    },
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

    if (!process.env.ADMIN_PASSWORD) {
        throw new Error("ADMIN_PASSWORD is not set in the environment variables.");
    }
    const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);

    // Delete current tickets and users in DB first.
    await prisma.user.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.organization.deleteMany();



    // recreate them.
    const dbOrganization = await prisma.organization.create({
        data: {
            name: "Organization 1",
        }
    })

    const dbUsers = await prisma.user.createManyAndReturn({
        data: users.map((user) => ({
            ...user,
             passwordHash,
        })),
    });

    await prisma.membership.createMany({
        data: [{
            userId: dbUsers[0].id,
            organizationId: dbOrganization.id,
            isActive: true,
            membershipRole: "ADMIN"
        },
            {
                userId: dbUsers[1].id,
                organizationId: dbOrganization.id,
                isActive: true,
                membershipRole: "MEMBER"
            },

        ]
    })

    const dbTickets = await prisma.ticket.createManyAndReturn({
        data: tickets.map((ticket) => ({
            ...ticket,
            userId: dbUsers[0].id,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 100000)),
            organizationId: dbOrganization.id,
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