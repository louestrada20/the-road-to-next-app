export const getBaseUrl = () => {
    const environment = process.env.NODE_ENV;
  
    if (environment === "production") {
        return "https://www.roadtonextpro.com";
    }
  
    if (environment === "development") {
        return "http://localhost:3000";
    }
  
    // For Vercel preview deployments
    return `https://${process.env.VERCEL_URL}`;
};