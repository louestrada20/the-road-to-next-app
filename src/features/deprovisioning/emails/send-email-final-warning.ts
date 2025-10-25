import EmailFinalWarning from "@/emails/deprovisioning/email-final-warning";
import { resend } from "@/lib/resend";

export const sendEmailFinalWarning = async (
  adminEmail: string,
  adminName: string,
  organizationName: string,
  hoursRemaining: number,
  affectedUserCount: number,
  executionDate: string
) => {
  return await resend.emails.send({
    from: "no-reply@app.roadtonextpro.com",
    to: adminEmail,
    subject: `Final Warning: ${hoursRemaining} hours until member removal - ${organizationName}`,
    react: EmailFinalWarning({
      organizationName,
      adminName,
      hoursRemaining,
      affectedUserCount,
      executionDate,
    }),
  });
};

