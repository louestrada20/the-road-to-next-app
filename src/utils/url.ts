export const getBaseUrl = () => {
    // Use custom app URL if set (recommended for production)
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    const environment = process.env.NODE_ENV;
    
    // Fallback to localhost in development
    if (environment === "development") {
        return "http://localhost:3000";
    }
    
    // Fallback to Vercel URL for preview deployments
    return `https://${process.env.VERCEL_URL}`;
}
