
import {CardCompact} from "@/components/card-compact";
import {PasswordForgotForm} from "@/features/password/components/password-forgot-form";


const PasswordForgotPage = () => {
    return (
        <div className="flex flex-col flex-1 justify-center items-center ">
            <CardCompact className="w-full max-w-[420px] animate-fade-in-from-top" title="Forgot Password" description="Enter your email address to reset your password"
                         content={<PasswordForgotForm />}
            />
        </div>
    )
};

export default PasswordForgotPage;