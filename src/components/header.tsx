"use client"
import { LucideSquareKanban, Menu} from "lucide-react";
import Link from "next/link";
import {AccountDropdown} from "@/app/_navigation/account-dropdown";
import {MobileAuthDropdown} from "@/components/mobile-auth-dropdown";
import {useMobileSidebar} from "@/components/mobile-sidebar-context";
import {ThemeSwitcher} from "@/components/theme/theme-switcher";
import {buttonVariants} from "@/components/ui/button";
import {useAuth} from "@/features/auth/hooks/use-auth";
import {homePath, signInPath, signUpPath} from "@/paths";


const Header =  () => {
const {user, isFetched} = useAuth();
const { toggle } = useMobileSidebar();

    if (!isFetched) {
        return null;
    }

    const navItems = user ? (
        <AccountDropdown user={user} />
    ) : (
        <>
            {/* Mobile: Dropdown menu */}
            <div className="sm:hidden">
                <MobileAuthDropdown />
            </div>
            
            {/* Desktop: Individual buttons */}
            <div className="hidden sm:flex gap-x-2">
                <Link href={signUpPath()} className={buttonVariants({variant: "outline", size: "sm"})}>
                    Sign Up
                </Link>
                <Link href={signInPath()} className={buttonVariants({variant: "default", size: "sm"})}>
                    Sign In
                </Link>
            </div>
        </>
    );

    return (
        <nav className="animate-header-from-top supports-backdrop-blur:bg-background/60 fixed left-0 right-0 top-0 z-20 border-b bg-background/95 backdrop-blur w-full flex py-2.5 px-3 sm:px-5">
            {/* Mobile-First Two Column Layout */}
            <div className="flex items-center justify-between w-full">
                
                {/* Left: Hamburger Menu + Logo */}
                <div className="flex items-center gap-x-2">
                    {/* Mobile hamburger menu */}
                    <button
                        onClick={toggle}
                        className="sm:hidden p-2 rounded-md hover:bg-muted"
                        aria-label="Open navigation menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    
                    <Link href={homePath()} className={buttonVariants({variant: "ghost", size: "sm"})}>
                        <LucideSquareKanban className="h-5 w-5"/>
                        <h1 className="text-base sm:text-lg font-semibold">
                            <span className="hidden sm:inline">TicketBounty</span>
                            <span className="sm:hidden">TB</span>
                        </h1>
                    </Link>
                </div>

                {/* Center: Attribution (hidden on mobile, shown on larger screens) */}
                <div className="hidden lg:block text-xs text-muted-foreground text-center">
                    Website by Louis Estrada - from The Road to Next Course by Robin Wieruch:&nbsp;
                    <a href="https://www.road-to-next.com/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:underline">
                          Road To Next
                    </a>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-x-1 sm:gap-x-2">
                    <ThemeSwitcher />
                    {navItems}
                </div>
            </div>
        </nav>
    )
};

export {Header}