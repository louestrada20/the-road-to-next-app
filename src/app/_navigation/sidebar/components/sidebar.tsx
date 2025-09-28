"use client"

import {usePathname} from "next/navigation";
import {useState} from "react";
import {SideBarItem} from "@/app/_navigation/sidebar/components/sidebar-item";
import {navItems} from "@/app/_navigation/sidebar/constants";
import {useAuth} from "@/features/auth/hooks/use-auth";
import {cn} from "@/lib/utils";
import {pricingPath, signInPath, signUpPath} from "@/paths";
import {getActivePath} from "@/utils/get-active-path";

const SideBar = () => {
    const pathName = usePathname();
    const {activeIndex} = getActivePath(pathName,
        navItems.map((item) => item.href),
        [signInPath(), signUpPath(), pricingPath()]
        );


    const {user, isFetched} = useAuth();
    
    const [isTransition, setTransition] = useState(false);
    const [isOpen, setOpen] = useState(false);

    const handleToggle = (open: boolean) => {
       setTransition(true);
       setOpen(open);
       //these 2 setter functions above will get batched and trigger together.
        //so the one below we set a timer on it, so we can show the transition styles after a timeout of 200 miliseconds.
       setTimeout(() => setTransition(false), 200);
    }

    if (!user || !isFetched) {
        // return an empty div placeholder for the sidebar to avoid layout shift issues while the user is fetched and auth'd
        return <div className="w-[78px] bg-secondary/20 h-screen border-r pt-24" ></div>
    }

    return (
        <nav className={cn(
            "animate-sidebar-from-left",
            "h-screen  border-r pt-24",
            isTransition && "duration-200",
            isOpen ? "md:w-60 w-[78px]" : "w-[78px]"
            )}
            onMouseEnter={() => handleToggle(true)}
             onMouseLeave={() => handleToggle(false)}
        >
            <div className="px-3 py-2">
                <nav className="space-y-2">
                    {
                        navItems.map((navItem, index) => (
                            <SideBarItem
                            key={navItem.title}
                            isOpen={isOpen}
                            isActive={activeIndex === index}
                            navItem={navItem}
                            />
                        ))
                    }
                </nav>
            </div>

        </nav>
    )
}

export {SideBar}