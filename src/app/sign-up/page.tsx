import Link from "next/link";
import {CardCompact} from "@/components/card-compact";
import {SignUpForm} from "@/features/auth/components/sign-up-form";
import {signInPath} from "@/paths";


const SignUpPage = () => {
    return (
    <div className="flex flex-col flex-1 justify-center items-center ">
        <CardCompact className="w-full max-w-[420px] animate-fade-in-from-top" title="Sign Up" description="Create an account to get started"
                     content={<SignUpForm />}
                     footer={<Link className="tx-sm text-muted-foreground" href={signInPath()}>Have an account? Sign in now.</Link>}
        />
    </div>
    )
};

export default SignUpPage;