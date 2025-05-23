import {CardCompact} from "@/components/card-compact";
import {OrganizationCreateForm} from "@/features/organization/components/organization-create-form"

const OnboardingPage = () => {
    return (
        <div className="flex flex-1 flex-col justify-center items-center">
            <CardCompact title="Create Organization"
                         description="Create an organization to get started"
                         content={<OrganizationCreateForm />}
                         className="w-full max-w-[420px] animate-fade-in-from-top"
            />
        </div>
    )
}

export default OnboardingPage;