import { PrismaClient } from "@prisma/client";
import { del,list } from "@vercel/blob";
import * as fs from 'fs';
import * as path from 'path';
import { createDefaultAttachments } from "@/features/attachments/utils/create-default-attachments";
import { hashPassword } from "@/features/auth/password";
import * as ticketData from "@/features/ticket/data";
import { generateRandomToken, hashToken } from "@/utils/crypto";
import { findTicketIdsFromText } from "@/utils/find-ids-from-text";

const prisma = new PrismaClient();

// Simple configuration
const CREATE_TEST_SCENARIOS = process.env.NODE_ENV !== 'production';

// Core user set (12 users total)
const createUsers = async (passwordHash: string) => {
  const users = [
    // Admin users (real emails)
    {
      username: "admin",
      email: "louestrada31@gmail.com",
      firstName: "Louis",
      lastName: "Estrada",
      emailVerified: true,
    },
    {
      username: "admin2",
      email: "louestrada30@gmail.com",
      firstName: "Louis",
      lastName: "Admin",
      emailVerified: true,
    },
    // Regular verified users (fake emails)
    {
      username: "john_doe",
      email: "john@test.local",
      firstName: "John",
      lastName: "Doe",
      emailVerified: true,
    },
    {
      username: "jane_smith",
      email: "jane@fake.email",
      firstName: "Jane",
      lastName: "Smith",
      emailVerified: true,
    },
    {
      username: "bob_wilson",
      email: "bob@demo.local",
      firstName: "Bob",
      lastName: "Wilson",
      emailVerified: true,
    },
    {
      username: "alice_johnson",
      email: "alice@example.test",
      firstName: "Alice",
      lastName: "Johnson",
      emailVerified: true,
    },
    {
      username: "charlie_brown",
      email: "charlie@notreal.local",
      firstName: "Charlie",
      lastName: "Brown",
      emailVerified: true,
    },
    // Unverified users (fake emails)
    {
      username: "unverified_user",
      email: "unverified@test.local",
      firstName: "Unverified",
      lastName: "User",
      emailVerified: false,
    },
    {
      username: "pending_verify",
      email: "pending@fake.email",
      firstName: "Pending",
      lastName: "Verification",
      emailVerified: false,
    },
    // E2E test users with known passwords (fake emails)
    {
      username: "e2e_admin",
      email: "e2e-admin@e2e.local",
      firstName: "E2E",
      lastName: "Admin",
      emailVerified: true,
    },
    {
      username: "e2e_member",
      email: "e2e-member@e2e.local",
      firstName: "E2E",
      lastName: "Member",
      emailVerified: true,
    },
    {
      username: "e2e_limited",
      email: "e2e-limited@e2e.local",
      firstName: "E2E",
      lastName: "Limited",
      emailVerified: true,
    },
  ];

  return await prisma.user.createManyAndReturn({
    data: users.map((user) => ({
      ...user,
      passwordHash,
    })),
  });
};

// Create tickets for an organization
const createTicketsForOrg = async (organizationId: string, userId: string, count: number, prefix: string) => {
  const statuses = ["OPEN", "IN_PROGRESS", "DONE"] as const;
  const tickets = [];
  
  for (let i = 0; i < count; i++) {
    tickets.push({
      title: `${prefix} Ticket ${i + 1}`,
      content: `This is a ${prefix.toLowerCase()} ticket number ${i + 1}. It contains important information about the task at hand.`,
      status: statuses[i % 3],
      bounty: 100 + (i * 50), // $1.00 to $5.50 in cents
      deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Future dates
      userId,
      organizationId,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
    });
  }
  
  return await prisma.ticket.createManyAndReturn({ data: tickets });
};

// Create deprovisioning queue entries at different stages
const createDeprovisioningScenarios = async (organizationId: string, userIds: string[]) => {
  const now = new Date();
  const stages = [
    { daysFromNow: 14, status: 'NOTIFIED_ONCE', userId: userIds[0] },
    { daysFromNow: 7, status: 'NOTIFIED_REMINDER', userId: userIds[1] },
    { daysFromNow: 1, status: 'NOTIFIED_FINAL', userId: userIds[2] },
    { daysFromNow: 0, status: 'PENDING', userId: userIds[3] }, // Ready to execute
    { daysFromNow: 9, status: 'CANCELED_UPGRADE', userId: userIds[4] },
  ];

  const entries = stages.map(stage => ({
    organizationId,
    userId: stage.userId,
    reason: 'SUBSCRIPTION_DOWNGRADE' as const,
    status: stage.status as "PENDING" | "NOTIFIED_ONCE" | "NOTIFIED_REMINDER" | "NOTIFIED_FINAL" | "COMPLETED",
    scheduledFor: new Date(now.getTime() + (stage.daysFromNow * 24 * 60 * 60 * 1000)),
    originalScheduledFor: new Date(now.getTime() + (stage.daysFromNow * 24 * 60 * 60 * 1000)),
    notificationsSent: stage.status === 'NOTIFIED_ONCE' ? 1 : 
                      stage.status === 'NOTIFIED_REMINDER' ? 2 : 
                      stage.status === 'NOTIFIED_FINAL' ? 3 : 0,
    lastNotificationAt: stage.status !== 'PENDING' ? new Date(now.getTime() - ((14 - stage.daysFromNow) * 24 * 60 * 60 * 1000)) : null,
  }));

  return await prisma.deprovisioningQueue.createMany({ data: entries });
};

const seed = async () => {
  const t0 = performance.now();
  console.log('🌱 Seeding database...');

  // Validate environment
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not set in the environment variables.");
  }

  // Create password hashes
  const adminPasswordHash = await hashPassword(process.env.ADMIN_PASSWORD);
  const e2ePasswordHash = await hashPassword("Test123!");

  // Clean up Vercel Blob attachments
  console.log('  Cleaning up Vercel Blob attachments...');
  try {
    const response = await list({ prefix: 'attachments/' });
    if (response.blobs.length > 0) {
      for (const blob of response.blobs) {
        try {
          await del(blob.url);
        } catch {
          // Continue on error
        }
      }
      console.log(`  ✓ Cleaned up ${response.blobs.length} blob files`);
    }
  } catch {
    console.log('  ⚠️  Skipping blob cleanup (service not configured)');
  }

  // Clean database
  console.log('  Cleaning existing data...');
  await prisma.user.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.deprovisioningQueue.deleteMany();

  // Create users
  console.log('  Creating users...');
  const dbUsers = await createUsers(adminPasswordHash);
  
  // Update E2E users with Test123! password
  const e2eEmails = ['e2e-admin@e2e.local', 'e2e-member@e2e.local', 'e2e-limited@e2e.local'];
  for (const email of e2eEmails) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: e2ePasswordHash }
    });
  }
  console.log(`  ✓ ${dbUsers.length} users created`);

  // Find specific users for assignments
  const adminUser = dbUsers.find(u => u.email === 'louestrada31@gmail.com')!;
  const admin2User = dbUsers.find(u => u.email === 'louestrada30@gmail.com')!;
  const e2eAdminUser = dbUsers.find(u => u.email === 'e2e-admin@e2e.local')!;
  const e2eMemberUser = dbUsers.find(u => u.email === 'e2e-member@e2e.local')!;
  const e2eLimitedUser = dbUsers.find(u => u.email === 'e2e-limited@e2e.local')!;

  // Create organizations
  console.log('  Creating organizations...');
  
  // 1. Main Test Org - Starter Plan (3 members)
  const mainOrg = await prisma.organization.create({
    data: {
      name: "Main Test Org",
      creatorUserId: adminUser.id,
    }
  });

  // 2. Deprovisioning Demo - Recently downgraded
  const deprovOrg = await prisma.organization.create({
    data: {
      name: "Deprovisioning Demo",
      creatorUserId: admin2User.id,
    }
  });

  // 3. E2E Test Org - Basic Plan (15 members)
  const e2eOrg = await prisma.organization.create({
    data: {
      name: "E2E Test Org",
      creatorUserId: e2eAdminUser.id,
    }
  });

  // 4. Multi-tenant Demo - Basic Plan
  const multiOrg = await prisma.organization.create({
    data: {
      name: "Multi-tenant Demo",
      creatorUserId: dbUsers[2].id, // john_doe
    }
  });

  console.log('  ✓ 4 organizations created');

  // Create memberships
  console.log('  Creating memberships...');
  
  // Main Test Org - 3 members (at Starter limit)
  await prisma.membership.createMany({
    data: [
      { userId: adminUser.id, organizationId: mainOrg.id, isActive: true, membershipRole: "ADMIN" },
      { userId: dbUsers[2].id, organizationId: mainOrg.id, isActive: true, membershipRole: "MEMBER" },
      { userId: dbUsers[3].id, organizationId: mainOrg.id, isActive: true, membershipRole: "MEMBER" },
    ]
  });

  // Deprovisioning Demo - 8 members (5 will be in deprovisioning queue)
  const deprovMembers = dbUsers.slice(2, 10); // john through pending_verify
  await prisma.membership.createMany({
    data: [
      { userId: admin2User.id, organizationId: deprovOrg.id, isActive: true, membershipRole: "ADMIN" },
      ...deprovMembers.map(user => ({
        userId: user.id,
        organizationId: deprovOrg.id,
        isActive: true,
        membershipRole: "MEMBER" as const,
      }))
    ]
  });

  // E2E Test Org - 5 members
  await prisma.membership.createMany({
    data: [
      { userId: e2eAdminUser.id, organizationId: e2eOrg.id, isActive: true, membershipRole: "ADMIN" },
      { userId: e2eMemberUser.id, organizationId: e2eOrg.id, isActive: true, membershipRole: "MEMBER" },
      { 
        userId: e2eLimitedUser.id, 
        organizationId: e2eOrg.id, 
        isActive: true, 
        membershipRole: "MEMBER",
        canUpdateTicket: false,
        canDeleteTicket: false
      },
      { userId: dbUsers[2].id, organizationId: e2eOrg.id, isActive: true, membershipRole: "MEMBER" },
      { userId: dbUsers[3].id, organizationId: e2eOrg.id, isActive: true, membershipRole: "MEMBER" },
    ]
  });

  // Multi-tenant Demo - 4 members
  await prisma.membership.createMany({
    data: [
      { userId: dbUsers[2].id, organizationId: multiOrg.id, isActive: true, membershipRole: "ADMIN" },
      { userId: dbUsers[3].id, organizationId: multiOrg.id, isActive: true, membershipRole: "MEMBER" },
      { userId: dbUsers[4].id, organizationId: multiOrg.id, isActive: true, membershipRole: "MEMBER" },
      { userId: dbUsers[5].id, organizationId: multiOrg.id, isActive: true, membershipRole: "MEMBER" },
    ]
  });

  console.log('  ✓ Memberships created');

  // Create deprovisioning scenarios
  if (CREATE_TEST_SCENARIOS) {
    console.log('  Creating deprovisioning scenarios...');
    const deprovUserIds = deprovMembers.slice(0, 5).map(u => u.id);
    await createDeprovisioningScenarios(deprovOrg.id, deprovUserIds);
    console.log('  ✓ 5 deprovisioning scenarios created');
  }

  // Create MCP Credentials
  console.log('  Creating MCP credentials...');
  
  // Main org credential (saved to .env)
  const mainMcpToken = generateRandomToken();
  const mainMcpTokenHash = hashToken(mainMcpToken);
  
  await prisma.credential.create({
    data: {
      name: "Local Development MCP Credential",
      type: "MCP",
      secretHash: mainMcpTokenHash,
      organizationId: mainOrg.id,
    }
  });

  // Other org credentials (not saved to .env)
  for (const org of [deprovOrg, e2eOrg, multiOrg]) {
    const token = generateRandomToken();
    const tokenHash = hashToken(token);
    await prisma.credential.create({
      data: {
        name: `${org.name} MCP Credential`,
        type: "MCP",
        secretHash: tokenHash,
        organizationId: org.id,
      }
    });
  }

  // Write main org token to .env
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }
  
  const mcpTokenRegex = /^MCP_CREDENTIAL_TOKEN=.*$/m;
  const newTokenLine = `MCP_CREDENTIAL_TOKEN="${mainMcpToken}"`;
  
  if (mcpTokenRegex.test(envContent)) {
    envContent = envContent.replace(mcpTokenRegex, newTokenLine);
  } else {
    envContent += `\n# MCP Credential Token (auto-generated by seed script)\n${newTokenLine}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('  ✓ MCP credentials created');
  console.log(`  ✓ MCP credential saved to .env`);

  // Create tickets
  console.log('  Creating tickets...');
  
  // Main Test Org - 10 tickets
  const mainTickets = await createTicketsForOrg(mainOrg.id, adminUser.id, 10, "Main");
  
  // Deprovisioning Demo - 5 tickets
  const deprovTickets = await createTicketsForOrg(deprovOrg.id, admin2User.id, 5, "Deprov");
  
  // E2E Test Org - 8 tickets with predictable IDs
  const e2eTickets = await createTicketsForOrg(e2eOrg.id, e2eAdminUser.id, 8, "E2E");
  
  // Multi-tenant Demo - 6 tickets
  const multiTickets = await createTicketsForOrg(multiOrg.id, dbUsers[2].id, 6, "Multi");
  
  const totalTickets = mainTickets.length + deprovTickets.length + e2eTickets.length + multiTickets.length;
  console.log(`  ✓ ${totalTickets} tickets created`);

  // Create comments with references
  console.log('  Creating comments...');
  
  // Main org comments with references
  await prisma.comment.createMany({
    data: [
      {
        content: `This relates to the deprovisioning demo ticket /tickets/${deprovTickets[0].id}`,
        userId: adminUser.id,
        ticketId: mainTickets[0].id,
      },
      {
        content: "Great progress on this ticket!",
        userId: dbUsers[2].id,
        ticketId: mainTickets[0].id,
      },
      {
        content: `Also see ticket /tickets/${mainTickets[1].id} for related work`,
        userId: adminUser.id,
        ticketId: mainTickets[2].id,
      },
    ]
  });

  // E2E org comments (predictable for testing)
  await prisma.comment.createMany({
    data: [
      {
        content: "E2E test comment 1",
        userId: e2eAdminUser.id,
        ticketId: e2eTickets[0].id,
      },
      {
        content: "E2E test comment 2",
        userId: e2eMemberUser.id,
        ticketId: e2eTickets[0].id,
      },
    ]
  });

  console.log('  ✓ Comments created');

  // Process ticket references
  console.log('  Processing ticket references...');
  const createdComments = await prisma.comment.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  for (const comment of createdComments) {
    const rawIds = findTicketIdsFromText("tickets", comment.content);
    if (!rawIds.length) continue;

    const uniqueIds = Array.from(new Set(rawIds)).filter((id) => id !== comment.ticketId);
    if (!uniqueIds.length) continue;

    const existingIds = await ticketData.findExistingTicketIds(uniqueIds);
    if (!existingIds.length) continue;

    await ticketData.connectReferencedTickets(comment.ticketId, existingIds);
  }
  console.log('  ✓ Ticket references processed');

  // Create default attachments for first ticket in each org
  if (CREATE_TEST_SCENARIOS) {
    console.log('  Creating sample attachments...');
    try {
      await createDefaultAttachments(mainTickets[0].id);
      await createDefaultAttachments(e2eTickets[0].id);
      console.log('  ✓ Sample attachments created');
    } catch {
      console.log('  ⚠️  Skipping attachments (Vercel Blob not configured)');
    }
  }

  const t1 = performance.now();
  console.log(`\n✅ Database seed completed in ${Math.round(t1 - t0)}ms`);
  console.log('\n📊 Summary:');
  console.log(`  ✓ ${dbUsers.length} users created`);
  console.log('  ✓ 4 organizations created');
  if (CREATE_TEST_SCENARIOS) {
    console.log('  ✓ 5 deprovisioning scenarios created');
  }
  console.log(`  ✓ ${totalTickets} tickets created`);
  console.log('  ✓ MCP credential saved to .env');
  console.log('\n🚀 Ready for Stripe seed - run: npm run seed:stripe');
  console.log('\n📝 Quick start:');
  console.log('  - Sign in as louestrada31@gmail.com or louestrada30@gmail.com');
  console.log('  - E2E tests: e2e-admin@e2e.local (password: Test123!)');
  console.log('  - View deprovisioning stages in "Deprovisioning Demo" org');
  console.log('  - MCP server ready to use');
};

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});