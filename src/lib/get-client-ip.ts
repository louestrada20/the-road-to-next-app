import { headers } from "next/headers";

/**
 * Best-effort extraction of the caller's public IP address.
 *
 * Works in App Router Route Handlers, Server Actions, and Middleware.
 * Falls back to "unknown" when no header is present (e.g. local dev).
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();

  // X-Forwarded-For may contain a list: client, proxy1, proxy2 …
  const xff = hdrs.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0].trim();
    if (ip) return ip;
  }

  const realIp = hdrs.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}
