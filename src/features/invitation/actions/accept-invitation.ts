"use server"




import {redirect} from "next/navigation";
import {setCookieByKey} from "@/actions/cookies";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import { trackMembershipCreated } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma"
import {signInPath} from "@/paths";
import {hashToken} from "@/utils/crypto";


export const acceptInvitation = async (tokenId: string) => {
    try {

        const tokenHash = hashToken(tokenId);

       const invitation =  await prisma.invitation.findUnique({
            where: {
                tokenHash,
            }
        });

       if (!invitation) {
           return toActionState("ERROR", "Revoked or invalid verification token for invitation")
       }

       const user = await prisma.user.findUnique({
           where: {
               email: invitation.email,
           }
       })

        if (user) {

            await prisma.$transaction([
                prisma.invitation.delete({
                    where: {
                        tokenHash
                    }
                }),

                prisma.membership.create({
                    data: {
                        organizationId: invitation.organizationId,
                        userId: user.id,
                        membershipRole: "MEMBER",
                        isActive: false,
                    }
                })
            ])
            try {
                await trackMembershipCreated(user.id, invitation.organizationId, {
                    invitedUserId: user.id,
                    membershipRole: "MEMBER",
                });
            } catch (posthogError) {
                if (process.env.NODE_ENV === "development") {
                    console.error('[PostHog] Failed to track organization event:', posthogError);
                }
            }

        } else {

                await prisma.invitation.update({
                    where: {
                        tokenHash,
                    },
                    data: {
                        status: "ACCEPTED_WITHOUT_ACCOUNT"
                    }
                });
        }

    } catch (error) {
        return fromErrorToActionState(error);
    }

    await setCookieByKey("toast", "Invitation Accepted");
    redirect(signInPath());

}