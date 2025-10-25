import EmailRemovalCompleted from "@/emails/deprovisioning/email-removal-completed";
import { resend } from "@/lib/resend";

export const sendEmailRemovalCompleted = async (
  adminEmail: string,
  adminName: string,
  organizationName: string,
  deactivatedUserCount: number
) => {
  return await resend.emails.send({
    from: "no-reply@app.roadtonextpro.com",
    to: adminEmail,
    subject: `Member removal completed - ${organizationName}`,
    react: EmailRemovalCompleted({
      organizationName,
      adminName,
      deactivatedUserCount,
    }),
  });
};

