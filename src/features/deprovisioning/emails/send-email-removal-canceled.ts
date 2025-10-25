import EmailRemovalCanceled from "@/emails/deprovisioning/email-removal-canceled";
import { resend } from "@/lib/resend";

export const sendEmailRemovalCanceled = async (
  adminEmail: string,
  adminName: string,
  organizationName: string,
  savedUserCount: number
) => {
  return await resend.emails.send({
    from: "no-reply@app.roadtonextpro.com",
    to: adminEmail,
    subject: `Good news! Member removal canceled - ${organizationName}`,
    react: EmailRemovalCanceled({
      organizationName,
      adminName,
      savedUserCount,
    }),
  });
};

