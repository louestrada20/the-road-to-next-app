import { LucideGem, LucideLogOut, LucideUser} from "lucide-react";
import Link from "next/link";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {signOut} from "@/features/auth/actions/sign-out";
import {AuthUser} from "@/features/auth/types";
import {accountPasswordPath, accountProfilePath} from "@/paths";
import {pricingPath} from "@/paths";

type AccountDropdownProps = {
    user: AuthUser;
}



const AccountDropdown = ({user}: AccountDropdownProps) => {

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar>
                    <AvatarFallback className="cursor-pointer">{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href={accountProfilePath()}>
                    <LucideUser className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={accountPasswordPath()}>
                    <LucideUser className="mr-2 h-4 w-4" />
                    <span>Password</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href={pricingPath()}>
                    <LucideGem className="mr-2 h-4 w-4" />
                    <span>Pricing</span>
                </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                 <form action={signOut}>
                     <LucideLogOut className="mr-2 h-4 w-4" />
                     <button type="submit">Sign Out</button>
                 </form>
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    )
};

export {AccountDropdown};