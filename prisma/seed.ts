import {PrismaClient} from "@prisma/client";
import {hashPassword} from "@/features/auth/password";
import {createDefaultAttachments} from "@/features/attachments/utils/create-default-attachments";
import {list, del} from "@vercel/blob";
import {findTicketIdsFromText} from "@/utils/find-ids-from-text";
import * as ticketData from "@/features/ticket/data";

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
        { content: "This ticket is related to /tickets/TICKET_2_ID and /tickets/TICKET_3_ID" }, // Will reference tickets 2 & 3
        { content: "Fourth comment on ticket 1" },
        { content: "Fifth comment on ticket 1" },
        { content: "Sixth comment on ticket 1" },
        { content: "Seventh comment on ticket 1" },
        { content: "Eighth comment on ticket 1" },
        { content: "Ninth comment on ticket 1" },
        { content: "Tenth comment on ticket 1" },
    ],
    [
        { content: "Single comment for ticket 2 - no references to other tickets" }
    ],
    [
        { content: "This ticket 3 is related to /tickets/TICKET_1_ID" } // Will reference ticket 1
    ]
];

const seed = async () => {
    const t0 = performance.now();
    console.log('DB Seed: Started...')

    if (!process.env.ADMIN_PASSWORD) {
        throw new Error("ADMIN_PASSWORD is not set in the environment variables.");
    }
    const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);

    // Clean up all Vercel Blob attachments
    console.log('Cleaning up Vercel Blob attachments...');
    try {
        const response = await list({
            prefix: 'attachments/',
        });
        
        if (response.blobs.length > 0) {
            console.log(`Found ${response.blobs.length} blob files to delete`);
            
            // Delete all blobs
            for (const blob of response.blobs) {
                try {
                    await del(blob.url);
                } catch (error) {
                    console.error(`Failed to delete blob ${blob.pathname}:`, error);
                }
            }
            console.log(`Cleaned up ${response.blobs.length} blob files`);
        }
    } catch (error) {
        console.error('Failed to clean up Vercel Blob attachments:', error);
        console.log('Continuing with database seed...');
    }

    // Delete current tickets and users in DB first.
    await prisma.user.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.credential.deleteMany();

    // recreate them.
    const dbOrganization = await prisma.organization.create({
        data: {
            name: "Organization 1",
        }
    });

    console.log(`✓ Created organization: "${dbOrganization.name}" (${dbOrganization.id})`);

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

    // Create comments with proper ticket ID references for automatic ticket linking
    const commentsWithReferences = comments.map((commentGroup, ticketIndex) => 
        commentGroup.map((comment) => {
            let content = comment.content;
            // Replace placeholder IDs with actual ticket IDs
            content = content.replace('TICKET_1_ID', dbTickets[0].id);
            content = content.replace('TICKET_2_ID', dbTickets[1].id);
            content = content.replace('TICKET_3_ID', dbTickets[2].id);
            
            return {
                content,
                userId: dbUsers[0].id,
                ticketId: dbTickets[ticketIndex].id,
            };
        })
    );

    await prisma.comment.createMany({
        data: commentsWithReferences.flat()
    });



    // Process comments to create ticket references automatically
    console.log('Processing comments for ticket references...');
    
    const createdComments = await prisma.comment.findMany({
        orderBy: { createdAt: 'asc' }
    });
    
    // Process each comment for ticket references using existing utility functions
    for (const comment of createdComments) {
        const rawIds = findTicketIdsFromText("tickets", comment.content);
        if (!rawIds.length) continue;

        const uniqueIds = Array.from(new Set(rawIds)).filter((id) => id !== comment.ticketId);
        if (!uniqueIds.length) continue;

        const existingIds = await ticketData.findExistingTicketIds(uniqueIds);
        if (!existingIds.length) continue;

        await ticketData.connectReferencedTickets(comment.ticketId, existingIds);
    }
    
    console.log('✓ Ticket references created through comment processing:');
    console.log('  - Ticket 1 → references Tickets 2, 3 (tabs: both referenced & referencing)');
    console.log('  - Ticket 2 → no references (single card: referencing only)');
    console.log('  - Ticket 3 → references Ticket 1 (tabs: both referenced & referencing)');

    // Clean up any orphaned attachments (those without valid S3 keys)
    console.log('Cleaning up orphaned attachments...');
    const orphanedAttachments = await prisma.attachment.deleteMany({
        where: {
            s3Key: ""
        }
    });
    console.log(`Removed ${orphanedAttachments.count} orphaned attachment records`);

    // Create default attachments for the first ticket
    console.log('Creating default attachments for Ticket 1...');
    try {
        await createDefaultAttachments(dbTickets[0].id);
        console.log('Default attachments created successfully!');
    } catch (error) {
        console.error('Failed to create default attachments:', error);
        console.log('Note: Make sure to add sample-image-1.jpg and sample-image-2.png to public/default-attachments/');
    }


    const t1 = performance.now();
    console.log(`✓ DB Seed: Finished successfully (${t1 - t0}ms)`);
    console.log(`✓ Ready for Stripe seed - run: npm run stripe-seed`);
}

seed();