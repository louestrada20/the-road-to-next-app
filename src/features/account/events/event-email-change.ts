import {sendEmailChangeVerification} from "@/features/account/emails/send-email-change-verification";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {generateRandomCode} from "@/utils/crypto";

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
    async ({event, step}) => {
        const {userId, newEmail, username} = event.data;

        try {
            const code = await step.run("generate-code", async () => {
                try {
                    return generateRandomCode();
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "email-change-generate-code",
                        level: "error",
                        tags: { inngest: "email-change", step: "generate-code" },
                    });
                    throw error;
                }
            });

            await step.run("create-token", async () => {
                try {
                    await prisma.emailChangeToken.create({
                        data: {
                            code,
                            newEmail,
                            userId,
                            expiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_LIFETIME_MS),
                        }
                    });
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "email-change-create-token",
                        level: "error",
                        tags: { inngest: "email-change", step: "create-token" },
                    });
                    throw error;
                }
            });

            const result = await step.run("send-verification-email", async () => {
                try {
                    const emailResult = await sendEmailChangeVerification(username, newEmail, code);

                    if (emailResult.error) {
                        throw new Error(`${emailResult.error.name}: ${emailResult.error.message}`);
                    }

                    return emailResult;
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "email-change-send",
                        level: "error",
                        tags: { inngest: "email-change", step: "send-verification-email" },
                    });
                    throw error;
                }
            });

            return {event, body: result};
        } catch (error) {
            captureSentryError(error, {
                userId,
                action: "email-change",
                level: "error",
                tags: { inngest: "email-change" },
            });
            throw error;
        }
    }
);
