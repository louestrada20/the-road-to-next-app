import Link from "next/link";
import {closedClassName} from "@/app/_navigation/sidebar/constants";
import {NavItem} from "@/app/_navigation/sidebar/types";
import {buttonVariants} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {cn} from "@/lib/utils";

type SideBarItemProps = {
    isOpen: boolean;
    navItem: NavItem;
    isActive: boolean;
    onClick?: () => void;
    isMobile?: boolean;
}

const SideBarItem = ({isOpen, navItem, isActive, onClick, isMobile = false}: SideBarItemProps) => {


    return (
        <>
        {navItem.separator && <Separator />}
        <Link href={navItem.href} className={cn(
            buttonVariants({variant: "ghost"}),
            "group relative flex h-12 justify-start",
            isActive && "bg-muted font-bold hover:bg-muted"
        )} onClick={onClick}>
            {navItem.icon}
       
        <span className={cn(
            "absolute left-12 text-base duration-200",
            isMobile ? "block" : (isOpen ? "md:block hidden" : "w-[78px]"),
            !isOpen && !isMobile && closedClassName
        )}>
            {navItem.title}
        </span>
        </Link>
        </>
    )
}

export {SideBarItem};