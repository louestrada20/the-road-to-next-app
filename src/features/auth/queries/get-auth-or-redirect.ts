import {redirect} from "next/navigation";
import {getAuth} from "@/features/auth/actions/get-auth";
import {getOrganizationsByUser} from "@/features/organization/queries/get-organizations-by-user";
import {emailVerificationPath, onboardingPath, selectActiveOrganizationPath, signInPath} from "@/paths";

type GetAuthOrRedirectOptions = {
    checkEmailVerified?: boolean;
    checkOrganization?: boolean;
    checkActiveOrganization?: boolean;
}

export const getAuthOrRedirect = async (options?: GetAuthOrRedirectOptions) => {
console.log('get auth or redirect call!')
    const {checkEmailVerified = true, checkOrganization = true, checkActiveOrganization = true} = options ?? {};

   const auth = await getAuth();
   if (!auth.user) {
        redirect(signInPath())
    }

    if ( checkEmailVerified && !auth.user.emailVerified) {
        redirect(emailVerificationPath())
    }


    let activeOrganization;

    if (checkOrganization || checkActiveOrganization ) {
        const organizations = await getOrganizationsByUser();
        if (checkOrganization && !organizations.length) {
        redirect(onboardingPath());
        }

        activeOrganization = organizations.find((organization) => organization.membershipByUser.isActive);

        const hasActive = !!activeOrganization


        if (checkActiveOrganization && !hasActive) {
            redirect(selectActiveOrganizationPath());
        }

    }


    return {...auth, activeOrganization};
}