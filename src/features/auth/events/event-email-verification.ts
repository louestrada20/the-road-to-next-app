import {generateEmailVerificationCode} from "@/features/auth/utils/generate-email-verification-code";
import {sendEmailVerification} from "@/features/email-verification/send-email-verification";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";

export type EmailVerificationEventArgs  = {
    data: {
        userId: string;
    }
}

export const emailVerificationEvent = inngest.createFunction(
{id: "trigger-email-verification"},
{event: "app/auth.sign-up"},
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
                    action: "email-verification-fetch-user",
                    level: "error",
                    tags: { inngest: "trigger-email-verification", step: "fetch-user" },
                });
                throw error;
            }
        });

        const verificationCode = await step.run("generate-verification-code", async () => {
            try {
                return await generateEmailVerificationCode(user.id, user.email);
            } catch (error) {
                captureSentryError(error, {
                    userId,
                    action: "email-verification-generate-code",
                    level: "error",
                    tags: { inngest: "trigger-email-verification", step: "generate-verification-code" },
                });
                throw error;
            }
        });

        const result = await step.run("send-verification-email", async () => {
            try {
                const emailResult = await sendEmailVerification(user.username, user.email, verificationCode);

                if (emailResult.error) {
                    throw new Error(`${emailResult.error.name}: ${emailResult.error.message}`);
                }

                return emailResult;
            } catch (error) {
                captureSentryError(error, {
                    userId,
                    action: "email-verification-send",
                    level: "error",
                    tags: { inngest: "trigger-email-verification", step: "send-verification-email" },
                });
                throw error;
            }
        });

        return {event, body: result};
    } catch (error) {
        captureSentryError(error, {
            userId,
            action: "email-verification",
            level: "error",
            tags: { inngest: "trigger-email-verification" },
        });
        throw error;
    }
})