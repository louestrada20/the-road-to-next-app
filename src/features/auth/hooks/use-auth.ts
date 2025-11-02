import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import {getAuth} from "@/features/auth/actions/get-auth";
import {AuthUser} from "@/features/auth/types";
import {getActiveOrganizationClient} from "@/features/organization/queries/get-active-organization-client";
import {identifyUser} from "@/lib/posthog/identify-client";

const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isFetched, setIsFetched] = useState(false);
    const pathName = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            const {user} = await getAuth();
            console.log('get auth call from use auth!')
            setUser(user);
            setIsFetched(true);

            // Identify user in PostHog when loaded
            if (user) {
                const activeOrganization = await getActiveOrganizationClient();
                identifyUser(user.id, {
                    email: user.email,
                    username: user.username,
                    organizationId: activeOrganization?.id,
                });
            }
        }
        fetchUser();
    }, [pathName]);

    return {user, isFetched};
}

export {useAuth}