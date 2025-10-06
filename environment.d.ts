

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: "development" | "production";
            STRIPE_SECRET_KEY: string;
            UPSTASH_REDIS_REST_URL: string;
            UPSTASH_REDIS_REST_TOKEN: string;
            BLOB_READ_WRITE_TOKEN: string;
        }
    }
}

export {};