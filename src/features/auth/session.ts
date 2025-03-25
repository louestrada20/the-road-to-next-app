import {sha256} from "@oslojs/crypto/sha2";
import {
    encodeBase32LowerCaseNoPadding,
    encodeHexLowerCase
} from "@oslojs/encoding";
import {prisma} from "@/lib/prisma";

export const generateRandomSessionToken = () => {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return encodeBase32LowerCaseNoPadding(bytes);
};

const SESSION_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24 * 15; // 15 days
const SESSION_MAX_DURATION_MS = SESSION_REFRESH_INTERVAL_MS * 2;  // 30 days

const fromSessionTokenToSessionId = (sessionToken: string) => {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(sessionToken)));
};


export const createSession = async (sessionToken: string, userId: string) => {
    const sessionId = fromSessionTokenToSessionId(sessionToken);

    const session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + SESSION_MAX_DURATION_MS),
        refreshedAt: null,
    };

    await prisma.session.create({
        data: session,
    });

    return session;
};

export const validateSession = async (sessionToken: string) => {
    const sessionId = fromSessionTokenToSessionId(sessionToken);

    const result = await prisma.session.findUnique({
        where: {
            id: sessionId,
        },
        include: {
            user: true,
        },
    });

    if (!result) {
        return { session: null, user: null, fresh: false };
    }

    const { user, ...session } = result;

    if (Date.now() >= session.expiresAt.getTime()) {
        await prisma.session.delete({
            where: {
                id: sessionId,
            },
        });
        return { session: null, user: null, fresh: false };
    }


    //Refresh logic

    let fresh = false; // Default to false
    const lastRefreshThreshold = session.expiresAt.getTime() - SESSION_REFRESH_INTERVAL_MS;

    // Refresh only if it's within 15 days of expiring and hasn't already been refreshed in this cycle
    if (Date.now() >= lastRefreshThreshold && (!session.refreshedAt || session.refreshedAt.getTime() < lastRefreshThreshold)) {
        session.expiresAt = new Date(Date.now() + SESSION_MAX_DURATION_MS);
        session.refreshedAt = new Date();
        fresh = true;

        await prisma.session.update({
            where: { id: sessionId },
            data: { expiresAt: session.expiresAt, refreshedAt: session.refreshedAt },
        });
    }

    return { session: { ...session }, user, fresh };
};


export const invalidateSession = async (sessionId: string) => {
    await prisma.session.delete({
        where: {
            id: sessionId,
        },
    });
};

export async function invalidateAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
        where: {
            userId: userId
        }
    });
}