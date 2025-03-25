import {LucideBook, LucideCircleUser, LucideLibrary} from "lucide-react";
import {NavItem} from "@/app/_navigation/sidebar/types";
import {accountProfilePath, homePath, ticketsPath} from "@/paths";

export const navItems: NavItem[] = [
    {
        title: "All Tickets",
        icon: <LucideLibrary className="h-5 w-5" />,
        href: homePath(),
    },
    {
      title: "My Tickets",
      icon: <LucideBook className="h-5 w-5" />,
      href: ticketsPath(),
    },
    {
        separator: true,
        title: "Account",
        icon: <LucideCircleUser className="h-5 w-5" />,
        href: accountProfilePath(),
    },
];

export const closedClassName =
"text-background opacity-0 transition-all duration-300 group-hover:z-40 group-hover:ml-4 group-hover:rounded group-hover:bg-foreground group-hover:p-2 group-hover:opacity-100";

