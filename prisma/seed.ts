import {PrismaClient} from "@prisma/client";
import {hashPassword} from "@/features/auth/password";
import {createDefaultAttachments} from "@/features/attachments/utils/create-default-attachments";
import {ListObjectsV2Command, DeleteObjectsCommand} from "@aws-sdk/client-s3";
import {s3} from "@/lib/aws";
import { generateCredential } from "@/features/credential/utils/generate-credential";   

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

    // Clean up all attachment uploads (originals and thumbnails)
    console.log('Cleaning up S3 attachment uploads...');
    try {
        const objectsToDelete: { Key: string }[] = [];
        let continuationToken: string | undefined;
        
        do {
            const listResponse = await s3.send(new ListObjectsV2Command({
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: 'uploads/',
                ContinuationToken: continuationToken,
            }));

            if (listResponse.Contents) {
                objectsToDelete.push(...listResponse.Contents.map(obj => ({ Key: obj.Key! })));
            }

            continuationToken = listResponse.NextContinuationToken;
        } while (continuationToken);

        if (objectsToDelete.length > 0) {
            console.log(`Found ${objectsToDelete.length} attachment files to delete`);
            
            // Delete objects in batches of 1000 (S3 limit)
            const batchSize = 1000;
            for (let i = 0; i < objectsToDelete.length; i += batchSize) {
                const batch = objectsToDelete.slice(i, i + batchSize);
                
                if (batch.length > 0) {
                    await s3.send(new DeleteObjectsCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Delete: {
                            Objects: batch,
                            Quiet: false
                        }
                    }));
                }
            }
            console.log(`Cleaned up ${objectsToDelete.length} attachment files (including thumbnails)`);
        }
    } catch (error) {
        console.error('Failed to clean up S3 attachment uploads:', error);
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


    // NEW: create a default credential for this organisation
    const seedCredentialSecret = await generateCredential(
        dbOrganization.id,
        "Credential 1"
    );

    console.log('Seed credential secret:', seedCredentialSecret);   

    // Create default attachments for the first ticket
    console.log('Creating default attachments for Ticket 1...');
    try {
        await createDefaultAttachments(dbTickets[0].id, dbOrganization.id);
        console.log('Default attachments created successfully!');
    } catch (error) {
        console.error('Failed to create default attachments:', error);
        console.log('Note: Make sure to add sample-image-1.jpg and sample-image-2.png to public/default-attachments/');
    }


    const t1 = performance.now();
    console.log(`DB Seed: Finished (${t1 - t0}ms)`)
}

seed();