import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import {getAuth} from "@/features/auth/actions/get-auth";
import {AuthUser} from "@/features/auth/types";

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
        }
        fetchUser();
    }, [pathName]);

    return {user, isFetched};
}

export {useAuth}