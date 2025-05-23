import {generateEmailVerificationCode} from "@/features/auth/utils/generate-email-verification-code";
import {sendEmailVerification} from "@/features/email-verification/send-email-verification";
import {inngest} from "@/lib/inngest";
import {prisma} from "@/lib/prisma";

export type EmailVerificationEventArgs  = {
    data: {
        userId: string;
    }
}

export const emailVerificationEvent = inngest.createFunction(
{id: "trigger-email-verification"},
{event: "app/auth.sign-up"},
async ({event}) => {
    const {userId} = event.data;

    const user = await prisma.user.findUniqueOrThrow({
        where: {id: userId},
    })

    const verificationCode = await generateEmailVerificationCode(user.id, user.email);

   const result = await sendEmailVerification(user.username, user.email, verificationCode);

   if (result.error) {
       throw new Error(`${result.error.name}: ${result.error.message}`);
   }

   return {event, body: result}
})