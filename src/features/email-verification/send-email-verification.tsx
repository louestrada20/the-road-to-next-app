
import EmailVerification from "@/emails/verify-email/email-verify";
import {resend} from "@/lib/resend";
export const sendEmailVerification = async (username: string, email: string, otp: string,) => {

    return await resend.emails.send({
        from: "no-reply@app.roadtonextpro.com",
        to: email,
        subject: "Please verify your email",
        react: <EmailVerification otp={otp} toName={username}  />,
    })
}