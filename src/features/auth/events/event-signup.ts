import { inngest } from "@/lib/inngest";

export const signUpFanOut = inngest.createFunction(
    { id: "signup-fanout" },
    { event: "app/auth.sign-up" },
    async ({ event, step }) => {
        const { userId } = event.data;

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
    }
);
