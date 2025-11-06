import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasDSN: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    dsnPreview: process.env.NEXT_PUBLIC_SENTRY_DSN 
      ? process.env.NEXT_PUBLIC_SENTRY_DSN.substring(0, 30) + "..."
      : "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  });
}

