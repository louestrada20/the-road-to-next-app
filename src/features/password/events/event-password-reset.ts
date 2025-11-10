import {sendEmailPasswordReset} from "@/features/password/emails/send-email-password-reset";
import {generatePasswordResetLink} from "@/features/password/utils/generate-password-reset-link";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";

export type PasswordResetEventArgs = {
    data: {
        userId: string,
    }
}

export const passwordResetEvent = inngest.createFunction(
    {id: "password-reset"},
    {event: "app/password.password-reset", },
    async ({event, step}) => {
        const {userId} = event.data;

        try {
            const user = await step.run("fetch-user", async () => {
                try {
                    return await prisma.user.findUniqueOrThrow({
                        where: {id: userId},
                    });
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "password-reset-fetch-user",
                        level: "error",
                        tags: { inngest: "password-reset", step: "fetch-user" },
                    });
                    throw error;
                }
            });

            const passwordResetLink = await step.run("generate-reset-link", async () => {
                try {
                    return await generatePasswordResetLink(user.id);
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "password-reset-generate-link",
                        level: "error",
                        tags: { inngest: "password-reset", step: "generate-reset-link" },
                    });
                    throw error;
                }
            });

            const result = await step.run("send-reset-email", async () => {
                try {
                    const emailResult = await sendEmailPasswordReset(user.username, user.email, passwordResetLink);

                    if (emailResult.error) {
                        throw new Error(`${emailResult.error.name}: ${emailResult.error.message}`);
                    }

                    return emailResult;
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "password-reset-send",
                        level: "error",
                        tags: { inngest: "password-reset", step: "send-reset-email" },
                    });
                    throw error;
                }
            });

            return {event, body: result };
        } catch (error) {
            captureSentryError(error, {
                userId,
                action: "password-reset",
                level: "error",
                tags: { inngest: "password-reset" },
            });
            throw error;
        }
    }
)