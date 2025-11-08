import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
    currentBaseUrl: (() => {
      const environment = process.env.NODE_ENV;
      return environment === "development" 
        ? "http://localhost:3000" 
        : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    })(),
  })
}

