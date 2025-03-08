import {PrismaClient} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {prisma: PrismaClient};

export const prisma = globalForPrisma.prisma  || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
// only for dev environment we set a global for the prisma instance, if there is no global set, then we initialize a new PrismaClient.
// If there is already one assigned/initialized, then we just take that one instead of init'ing a new one.
// we can only have ONE prisma instance in our dev environment.
// HOT RELOADING can cause issues with this, so this is a safeguard/prevents issues.


