import {sendEmailWelcome} from "@/features/account/emails/send-email-welcome";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";

export type WelcomeEventArgs = {
    data: {
        userId: string,
    }
}

export const welcomeEvent = inngest.createFunction(
    {id: "welcome"},
    {event: "app/account.welcome", },
    async ({event, step}) => {
        await step.sleep("wait-a-moment-after-signup", "10m");
        const {userId} = event.data;
        const user = await prisma.user.findUniqueOrThrow({
            where: {id: userId},
        })

        const result =  await sendEmailWelcome(user.username, user.email);

        if (result.error) {
            throw new Error(`${result.error.name}: ${result.error.message}`)
        }

        return {event, body: result };


    }
)