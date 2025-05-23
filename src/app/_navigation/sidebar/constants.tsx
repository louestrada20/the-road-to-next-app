import {LucideBook, LucideBookCopy, LucideCircleUser, LucideLibrary, LucideUsers} from "lucide-react";
import {NavItem} from "@/app/_navigation/sidebar/types";
import {accountProfilePath, homePath, organizationPath, ticketsByOrganizationPath, ticketsPath} from "@/paths";

export const navItems: NavItem[] = [
    {
        title: "All Tickets",
        icon: <LucideLibrary className="h-5 w-5" />,
        href: homePath(),
    },
    {
        title: "Our Tickets",
        icon: <LucideBookCopy className="h-5 w-5" />,
        href: ticketsByOrganizationPath(),
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

    {
        title: "Organization",
        icon: <LucideUsers />,
        href: organizationPath(),
    }
];

export const closedClassName =
"text-background opacity-0 transition-all duration-300 group-hover:z-40 group-hover:ml-4 group-hover:rounded group-hover:bg-foreground group-hover:p-2 group-hover:opacity-100";

