"use client"

import { usePathname } from "next/navigation";
import { SideBarItem } from "@/app/_navigation/sidebar/components/sidebar-item";
import { navItems } from "@/app/_navigation/sidebar/constants";
import { useMobileSidebar } from "@/components/mobile-sidebar-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { pricingPath, signInPath, signUpPath } from "@/paths";
import { getActivePath } from "@/utils/get-active-path";

const MobileSidebar = () => {
  const pathName = usePathname();
  const { activeIndex } = getActivePath(
    pathName,
    navItems.map((item) => item.href),
    [signInPath(), signUpPath(), pricingPath()]
  );

  const { user, isFetched } = useAuth();
  const { isOpen, setIsOpen } = useMobileSidebar();

  if (!user || !isFetched) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        
        <div className="flex h-full flex-col">
          {/* Header with logo */}
          <div className="flex items-center gap-x-2 p-4 border-b">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TB</span>
            </div>
            <h1 className="text-lg font-semibold">TicketBounty</h1>
          </div>

          {/* Navigation items */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navItems.map((navItem, index) => (
                <SideBarItem
                  key={navItem.title}
                  isOpen={true} // Always show full text on mobile
                  isActive={activeIndex === index}
                  navItem={navItem}
                  onClick={() => setIsOpen(false)} // Close sheet when item is clicked
                  isMobile={true} // This is the mobile sidebar
                />
              ))}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { MobileSidebar };
