import EmailChangeVerification from "@/emails/account/email-change-verification";       
import {resend} from "@/lib/resend";

export const sendEmailChangeVerification = async (username: string, email: string, code: string) => {
    return await resend.emails.send({
        from: "no-reply@app.roadtonextpro.com",
        to: email,
        subject: "Verify your new email address",
        react: <EmailChangeVerification code={code} toName={username} />,
    });
};
