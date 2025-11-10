import {getTickets} from "@/features/ticket/queries/get-tickets";
import {searchParamsCache} from "@/features/ticket/search-params";
import { getClientIp } from "@/lib/get-client-ip";
import { limitIp } from "@/lib/rate-limit";
import { captureSentryError } from "@/lib/sentry/capture-error";

export async function GET(request: Request) {
    try {
        const ip = await getClientIp();
        const res = await limitIp(ip, "tickets", 100, "1 m");
        if (!res.success) {
            return new Response("Too many requests", {status: 429});
        }
        const {searchParams} = new URL(request.url);

        const untypedSearchParams = Object.fromEntries(searchParams);

        const typedSearchParams = searchParamsCache.parse(untypedSearchParams);

        const {list, metadata} = await getTickets(undefined, false, typedSearchParams);

        return Response.json({list, metadata})
    } catch (error) {
        captureSentryError(error, {
            action: "api-get-tickets",
            level: "error",
            tags: { route: "api", method: "GET" },
        });

        return new Response("Internal Server Error", { status: 500 });
    }
}