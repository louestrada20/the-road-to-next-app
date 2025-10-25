import { z } from 'zod';
import { getAuth } from '../auth';

export const getOrganizationInfoSchema = z.object({});

export const getOrganizationInfo = async (
  _params: z.infer<typeof getOrganizationInfoSchema>
) => {
  const { organization, credential } = getAuth();
  
  return {
    id: organization.id,
    name: organization.name,
    ticketCount: organization._count.tickets,
    memberCount: organization._count.memberships,
    credential: {
      name: credential.name,
      type: credential.type
    }
  };
};

