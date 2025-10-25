import { Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1) Single Redis instance shared across all functions
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Test user email that bypasses rate limiting for E2E tests
const TEST_USER_EMAIL = 'test@example.com';

// 2) Generic limiter – 20 requests / minute sliding window
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,                     // shows up in Upstash dashboard
});

/**
 * Coarse, stateless IP-wide limiter.
 * Default: 100 requests / minute, sliding window.
 */
export async function limitIp(
    ip: string,
    scope: string,
    limit = 100,
    window = "1 m" as Duration,
) {
    // Bypass rate limiting for localhost in development (for E2E tests)
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
        return { success: true, limit: 999, remaining: 999, reset: Date.now() + 60000, pending: Promise.resolve() };
    }
    
    // Create a fresh limiter for the requested window/limit
    const ipLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
    });
    return ipLimiter.limit(`ip:${scope}:${ip}`);
}
  
  /**
   * Auth-sensitive limiter that stacks combo → email rules.
   * Call this only after you have the e-mail / userId.
   */
  export async function limitEmail(
    ip: string,
    email: string,
    scope: string,
  ) {
    // Bypass rate limiting for test user (E2E tests)
    if (email === TEST_USER_EMAIL) {
        return { success: true, limit: 999, remaining: 999, reset: Date.now() + 60000, pending: Promise.resolve() };
    }
    
    // 1) combo ip + email  – 5 attempts / 5 min (fixed window)
    const comboLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, "5 m"),
        analytics: true,
    });
    const combo = await comboLimiter.limit(`combo:${scope}:${ip}:${email}`);
    if (!combo.success) return combo;

    // 2) email-only  – 10 attempts / hour (sliding window)
    const emailLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
    });
    return emailLimiter.limit(`email:${scope}:${email}`);
  }