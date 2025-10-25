import { CredentialType } from '@prisma/client';
import type { Duration } from '@upstash/ratelimit';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/rate-limit';
import { RateLimitError } from './errors';

const RATE_LIMITS: Record<CredentialType, { limit: number; window: Duration }> = {
  [CredentialType.MCP]: { limit: 200, window: '1 m' },
  [CredentialType.MCP_READ_ONLY]: { limit: 300, window: '1 m' },
  [CredentialType.API]: { limit: 100, window: '1 m' },
  [CredentialType.CLI]: { limit: 50, window: '1 m' },
  [CredentialType.WEBHOOK]: { limit: 1000, window: '1 m' },
};

export const rateLimitMCP = async (
  organizationId: string,
  credentialType: CredentialType,
  operation: string
) => {
  const { limit, window } = RATE_LIMITS[credentialType];
  const key = `mcp-${credentialType}-${operation}:${organizationId}`;
  
  // Create rate limiter for this operation
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
  });
  
  const res = await limiter.limit(key);
  
  if (!res.success) {
    throw new RateLimitError(60);
  }
};

