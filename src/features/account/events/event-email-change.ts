import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import {generateRandomCode} from "@/utils/crypto";
import {sendEmailChangeVerification} from "@/features/account/emails/send-email-change-verification";

const EMAIL_CHANGE_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 2; // 2 hours

export type EmailChangeEventArgs = {
    data: {
        userId: string;
        currentEmail: string;
        newEmail: string;
        username: string;
    }
}

export const emailChangeEvent = inngest.createFunction(
    {id: "email-change"},
    {event: "app/account.email-change"},
    async ({event}) => {
        const {userId, newEmail, username} = event.data;

        const code = generateRandomCode();

        await prisma.emailChangeToken.create({
            data: {
                code,
                newEmail,
                userId,
                expiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_LIFETIME_MS),
            }
        });

        const result = await sendEmailChangeVerification(username, newEmail, code);

        if (result.error) {
            throw new Error(`${result.error.name}: ${result.error.message}`);
        }

        return {event, body: result};
    }
);
