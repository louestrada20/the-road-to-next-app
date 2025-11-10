"use server"

import * as Sentry from "@sentry/nextjs";
import {redirect} from "next/navigation";
import {setCookieByKey} from "@/actions/cookies";
import {fromErrorToActionState, toActionState} from "@/components/form/utils/to-action-state";
import { trackMembershipCreated } from "@/lib/posthog/events/organization";
import {prisma} from "@/lib/prisma";
import { captureSentryError } from "@/lib/sentry/capture-error";
import {signInPath} from "@/paths";
import {hashToken} from "@/utils/crypto";


export const acceptInvitation = async (tokenId: string) => {
    let userId: string | undefined;
    let organizationId: string | undefined;

    try {
        Sentry.addBreadcrumb({
            category: "invitation.action",
            message: "Accepting invitation",
            level: "info",
        });

        const tokenHash = hashToken(tokenId);

       const invitation =  await prisma.invitation.findUnique({
            where: {
                tokenHash,
            }
        });

       if (!invitation) {
           return toActionState("ERROR", "Revoked or invalid verification token for invitation")
       }

       organizationId = invitation.organizationId;

       const user = await prisma.user.findUnique({
           where: {
               email: invitation.email,
           }
       })

        if (user) {
            userId = user.id;

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
                captureSentryError(posthogError, {
                    userId: user.id,
                    organizationId: invitation.organizationId,
                    action: "track-membership-created",
                    level: "warning",
                    tags: { analytics: "posthog" },
                });
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
        captureSentryError(error, {
            userId: userId,
            organizationId: organizationId,
            action: "accept-invitation",
            level: "error",
        });
        return fromErrorToActionState(error);
    }

    await setCookieByKey("toast", "Invitation Accepted");
    redirect(signInPath());

}