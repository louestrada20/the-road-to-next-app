import {prisma} from "@/lib/prisma";
import type {MemberSelectionOptions,RemovalCandidate, SelectionResult} from "../types";



/**
 * Selects members and invitations for removal when organization exceeds allowed limit
 * 
 * Priority order (remove first to last):
 * 1. Pending invitations (newest first)
 * 2. Regular members (MEMBER role, newest first)
 * 3. Admins (newest first, NEVER original creator, ALWAYS keep at least 1)
 * 
 * @param options - Organization ID and new member limit
 * @returns List of candidates to remove and whether manual intervention is needed
 */

export async function  selectMembersForRemoval(options: MemberSelectionOptions): Promise<SelectionResult> {
    const {
        organizationId, 
        newAllowedMembers, 
        protectCreator = false, 
        minimumAdmins = 1
    } = options;

    //1. Fetch all current data
    const [invitations, memberships, organization] = await Promise.all([
        prisma.invitation.findMany({
            where: {organizationId},
            orderBy: {createdAt: 'desc'},
        }),
        prisma.membership.findMany({
            where: {organizationId},
            include: {user: true},
            orderBy: {joinedAt: 'desc'},
        }),
        prisma.organization.findUnique({
            where: {id: organizationId},
            select: {creatorUserId: true},
        })
    ])


const currentTotal = invitations.length + memberships.length;
const excessCount = currentTotal - newAllowedMembers;

if (excessCount <= 0) {
    return {
        toRemove: [],
        requiresManualIntervention: false,
        stats: {
            currentTotal,
            newLimit: newAllowedMembers,
            excessCount: 0,
            invitationsToRemove: 0,
            membershipsToRemove: 0,
            adminsAffected: 0,
        }
    }
}

// 2. Build prioritized list of removal candidates
const candidates: RemovalCandidate[] = [];

// PRIORITY 1: Pending invitations (newest first)
for (const invitation of invitations) {
    candidates.push({
        type: 'invitation',
        id: invitation.email,
        email: invitation.email,
        reason: 'Pending invitation',
        priority: 1,
    })
}

  // PRIORITY 2: Regular members (MEMBER role, newest first)
  const regularMembers = memberships
    .filter((m) => m.membershipRole === "MEMBER")
    .reverse(); // Reverse to newest first

    for (const member of regularMembers) {
        candidates.push({
            type: 'membership',
            id: member.userId,
            userId: member.userId,
            reason: 'Regular member',
            priority: 2,
            membershipRole: "MEMBER",
            joinedAt: member.joinedAt,
            isOriginalCreator: false,
        })
    }


    // PRIORITY 3: Admins (newest first, NEVER original creator, ALWAYS keep at least 1)
    const admins = memberships.filter((m) => m.membershipRole === "ADMIN");

    const adminCount = admins.length;
    const removableAdminCount = Math.max(0, adminCount - minimumAdmins);

    if (removableAdminCount > 0) {
        // Sort admins: newest first, but filter out original creator if protecting
        let removableAdmins = admins
          .filter((admin) => {
            if (protectCreator && organization?.creatorUserId) {
              return admin.userId !== organization.creatorUserId;
            }
            return true;
          })
          .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime()); // Newest first
    
        // Only take the number we can safely remove
        removableAdmins = removableAdmins.slice(0, removableAdminCount);


    for (const admin of removableAdmins) {
      const isCreator = admin.userId === organization?.creatorUserId;
      candidates.push({
        type: "membership",
        id: admin.userId,
        userId: admin.userId,
        reason: isCreator
          ? "Admin (original creator, lowest priority)"
          : "Admin (newer admin)",
        priority: isCreator ? 4 : 3,
        membershipRole: "ADMIN",
        joinedAt: admin.joinedAt,
        isOriginalCreator: isCreator,
      });
    }
}




  // 3. Select exact number needed (respecting priority)
  const sortedCandidates = candidates.sort((a, b) => a.priority - b.priority);
  const toRemove = sortedCandidates.slice(0, excessCount);

  // 4. Calculate stats
  const invitationsToRemove = toRemove.filter((c) => c.type === "invitation").length;
  const membershipsToRemove = toRemove.filter((c) => c.type === "membership").length;
  const adminsAffected = toRemove.filter((c) => c.membershipRole === "ADMIN").length;

  // 5. Check if manual intervention is required
  const requiresManualIntervention = toRemove.length < excessCount;
  const interventionReason = requiresManualIntervention
    ? `Cannot automatically remove ${excessCount - toRemove.length} more member(s). ` +
      `Would violate minimum admin requirement (${minimumAdmins}) or creator protection rules.`
    : undefined;



    return {
        toRemove,
        requiresManualIntervention,
        interventionReason,
        stats: {
          currentTotal,
          newLimit: newAllowedMembers,
          excessCount,
          invitationsToRemove,
          membershipsToRemove,
          adminsAffected,
        },
      };


}
