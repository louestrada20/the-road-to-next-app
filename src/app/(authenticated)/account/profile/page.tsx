import {AccountTabs} from "@/app/(authenticated)/account/_navigation/tabs";
import {CardCompact} from "@/components/card-compact";
import {Heading} from "@/components/heading";
import {ChangeProfileForm} from "@/features/account/components/change-profile-form";
import {getAuthOrRedirect} from "@/features/auth/queries/get-auth-or-redirect";



const ProfilePage = async () => {
    const {user} = await getAuthOrRedirect();

    return (
        <div className="flex-1 flex flex-col gap-y-8">
            <Heading title="Profile" description="All your profile information." tabs={<AccountTabs />}/>
            <CardCompact className="w-full max-w-[420px] self-center" title="Update Profile" description="Profile Information" content={<ChangeProfileForm user={user} />} />

        </div>
    )
}

export default ProfilePage;