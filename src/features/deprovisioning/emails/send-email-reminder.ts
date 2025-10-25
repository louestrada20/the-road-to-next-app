import EmailReminder from "@/emails/deprovisioning/email-reminder";
import { resend } from "@/lib/resend";

export const sendEmailReminder = async (
  adminEmail: string,
  adminName: string,
  organizationName: string,
  daysRemaining: number,
  affectedUserCount: number,
  scheduledDate: string
) => {
  return await resend.emails.send({
    from: "no-reply@app.roadtonextpro.com",
    to: adminEmail,
    subject: `Reminder: ${daysRemaining} days until member removal - ${organizationName}`,
    react: EmailReminder({
      organizationName,
      adminName,
      daysRemaining,
      affectedUserCount,
      scheduledDate,
    }),
  });
};

