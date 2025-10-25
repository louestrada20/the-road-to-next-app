import EmailScheduledRemoval from "@/emails/deprovisioning/email-scheduled-removal";
import { resend } from "@/lib/resend";

export const sendEmailScheduledRemoval = async (
  adminEmail: string,
  adminName: string,
  organizationName: string,
  affectedUserCount: number,
  scheduledDate: string,
  membersList: string[]
) => {
  return await resend.emails.send({
    from: "no-reply@app.roadtonextpro.com",
    to: adminEmail,
    subject: `Action Required: Member removal scheduled for ${organizationName}`,
    react: EmailScheduledRemoval({
      organizationName,
      adminName,
      affectedUserCount,
      scheduledDate,
      membersList,
    }),
  });
};

