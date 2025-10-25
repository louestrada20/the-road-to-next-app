export type RemovalCandidate = {
    type: 'invitation' | 'membership'
    id: string;
    userId?: string;
    email?: string;
    reason: string;
    priority: number;
    membershipRole?: 'MEMBER' | 'ADMIN';
    joinedAt?: Date;
    isOriginalCreator?: boolean;
}


export type SelectionResult = {
   toRemove: RemovalCandidate[];
   requiresManualIntervention: boolean;
   interventionReason?: string;
   stats: {
    currentTotal: number;
    newLimit: number;
    excessCount: number;
    invitationsToRemove: number;
    membershipsToRemove: number;
    adminsAffected: number;
   }
}

export type MemberSelectionOptions = {
    organizationId: string;
    newAllowedMembers: number;
    protectCreator?: boolean;
    minimumAdmins?: number;
}

