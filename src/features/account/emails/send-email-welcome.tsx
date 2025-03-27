
import EmailWelcome from "@/emails/account/email-welcome";
import {resend} from "@/lib/resend";
export const sendEmailWelcome = async (username: string, email: string) => {

    return await resend.emails.send({
        from: "no-reply@app.roadtonextpro.com",
        to: email,
        subject: "Welcome to TicketBounty",
        react: <EmailWelcome toName={username}  />,
    })
}