"use client"
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { signInPath, signUpPath } from "@/paths";

const MobileAuthDropdown = () => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                    Auth
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem asChild>
                    <Link href={signUpPath()} className="w-full">
                        Sign Up
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={signInPath()} className="w-full">
                        Sign In
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export { MobileAuthDropdown };
