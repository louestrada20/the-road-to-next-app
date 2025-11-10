import {sendEmailWelcome} from "@/features/account/emails/send-email-welcome";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";

export type WelcomeEventArgs = {
    data: {
        userId: string,
    }
}

export const welcomeEvent = inngest.createFunction(
    {id: "trigger-welcome-email"},
    {event: "app/auth.sign-up", },
    async ({event, step}) => {
        const {userId} = event.data;

        try {
            await step.sleep("wait-a-moment-after-signup", "2m");

            const user = await step.run("fetch-user", async () => {
                try {
                    return await prisma.user.findUniqueOrThrow({
                        where: {id: userId},
                    });
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "welcome-email-fetch-user",
                        level: "error",
                        tags: { inngest: "trigger-welcome-email", step: "fetch-user" },
                    });
                    throw error;
                }
            });

            const result = await step.run("send-welcome-email", async () => {
                try {
                    const emailResult = await sendEmailWelcome(user.username, user.email);

                    if (emailResult.error) {
                        throw new Error(`${emailResult.error.name}: ${emailResult.error.message}`);
                    }

                    return emailResult;
                } catch (error) {
                    captureSentryError(error, {
                        userId,
                        action: "welcome-email-send",
                        level: "error",
                        tags: { inngest: "trigger-welcome-email", step: "send-welcome-email" },
                    });
                    throw error;
                }
            });

            return {event, body: result };
        } catch (error) {
            captureSentryError(error, {
                userId,
                action: "welcome-email",
                level: "error",
                tags: { inngest: "trigger-welcome-email" },
            });
            throw error;
        }
    }
)