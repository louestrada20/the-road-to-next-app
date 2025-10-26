import Link from "next/link";
import {CardCompact} from "@/components/card-compact";
import {SignInForm} from "@/features/auth/components/sign-in-form";
import {passwordForgotPath, signUpPath} from "@/paths";


const SignInPage = () => {
    return (
        <div className="flex flex-col flex-1 justify-center items-center ">
            <CardCompact className="w-full max-w-[420px] animate-fade-in-from-top" title="Sign In" description="Sign in to your account"
                         content={<SignInForm />}
                         footer={
                        <div className="justify-between flex flex-1">
                            <Link className="tx-sm text-muted-foreground" href={signUpPath()}>No account yet?</Link>
                            <Link className="tx-sm text-muted-foreground" href={passwordForgotPath()}>Forgot Password?</Link>
                        </div>
            }
            />
        </div>
    )
};

export default SignInPage;