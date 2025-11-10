import { inngest } from "@/lib/inngest";
import { captureSentryError } from "@/lib/sentry/capture-error";

export const signUpFanOut = inngest.createFunction(
    { id: "signup-fanout" },
    { event: "app/auth.sign-up" },
    async ({ event, step }) => {
        const { userId } = event.data;

        try {
            // Fan out the email verification event
            await step.sendEvent("trigger-email-verification", {
                name: "app/auth.email-verification",
                data: { userId },
            });

            // Fan out the welcome email event
            await step.sendEvent("trigger-welcome-email", {
                name: "app/account.welcome",
                data: { userId },
            });

            return { message: "Fan-out executed", userId };
        } catch (error) {
            captureSentryError(error, {
                userId,
                action: "signup-fanout",
                level: "error",
                tags: { inngest: "signup-fanout" },
            });
            throw error;
        }
    }
);
