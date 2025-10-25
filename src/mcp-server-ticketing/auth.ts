import { CredentialType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/utils/crypto';
import { AuthenticationError } from './errors';

export type MCPAuthContext = {
  organization: {
    id: string;
    name: string;
    _count: { tickets: number; memberships: number };
    memberships: Array<{ userId: string }>;
  };
  credential: {
    id: string;
    name: string;
    type: CredentialType;
  };
};

// Global auth context for MCP server
let globalAuthContext: MCPAuthContext | null = null;

export const initializeAuth = async (credentialToken: string): Promise<MCPAuthContext> => {
  const auth = await authenticateMCP(credentialToken);
  globalAuthContext = auth;
  return auth;
};

export const getAuth = (): MCPAuthContext => {
  if (!globalAuthContext) {
    throw new Error('MCP server not authenticated. Call initializeAuth first.');
  }
  return globalAuthContext;
};

export const authenticateMCP = async (
  credentialToken: string,
  requiredType: CredentialType = CredentialType.MCP
): Promise<MCPAuthContext> => {
  const hashedToken = hashToken(credentialToken);
  
  const credential = await prisma.credential.findUnique({
    where: { 
      secretHash: hashedToken,
      revokedAt: null
    },
    include: { 
      organization: {
        include: {
          memberships: {
            where: { isActive: true },
            take: 5,
            select: { userId: true, membershipRole: true }
          },
          _count: { 
            select: { tickets: true, memberships: true } 
          }
        }
      }
    }
  });
  
  if (!credential) {
    throw new AuthenticationError("Invalid or revoked credential");
  }
  
  // Verify credential type
  if (credential.type !== requiredType) {
    throw new AuthenticationError(
      `Invalid credential type. Expected ${requiredType}, got ${credential.type}`
    );
  }
  
  if (!credential.organization.memberships[0]) {
    throw new AuthenticationError("Organization has no active members");
  }
  
  // Update lastUsed (async, don't block)
  prisma.credential.update({
    where: { id: credential.id },
    data: { lastUsed: new Date() }
  }).catch(console.error);
  
  return {
    organization: credential.organization,
    credential: {
      id: credential.id,
      name: credential.name,
      type: credential.type
    }
  };
};

