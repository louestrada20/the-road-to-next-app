"use server"
import {redirect} from "next/navigation";
import {z} from "zod";
import {setCookieByKey} from "@/actions/cookies";
import {ActionState, fromErrorToActionState,} from "@/components/form/utils/to-action-state"
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";
import {prisma} from "@/lib/prisma";
import {ticketsPath} from "@/paths";
import { Organization } from "@prisma/client";
import { membershipsPath } from "@/paths";
import {inngest} from "@/lib/inngest";

const createOrganizationSchema = z.object({
    name: z.string().min(1).max(191),
});

export const createOrganization = async (_actionState: ActionState, formData: FormData) => {
    const {user} = await getAuthOrRedirect({
        checkOrganization: false,
        checkActiveOrganization: false,
    });


    let organization: Organization;

    try {
        const data = createOrganizationSchema.parse({
            name: formData.get("name"),
        });

        organization = await prisma.$transaction(async (tx) => {
            const org  =  await tx.organization.create({
                data: {
                    ...data,
                    memberships: {
                        create: {
                            userId: user.id,
                            isActive: true,
                            membershipRole: "ADMIN"
                        }
                    }
                }
            });
            await tx.membership.updateMany({
                where: {
                    userId: user.id,
                    organizationId: {
                        not: org.id,
                    }
                },
                data: {
                    isActive: false,
                }
            })
            return org;
        })


        await inngest.send({
            name: "app/organization.created",
            data: {
                organizationId: organization.id,
                byEmail: user.email,
            }
        });


    } catch (error) {
        return fromErrorToActionState(error);
    }
    await setCookieByKey("toast",   
         `<a href=${membershipsPath(organization.id)}>Organization </a> created`
        );
    redirect(ticketsPath());
}