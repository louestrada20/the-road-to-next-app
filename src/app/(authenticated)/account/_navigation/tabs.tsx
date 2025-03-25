"use client"
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {accountPasswordPath, accountProfilePath} from "@/paths";

const AccountTabs = () => {
    const pathName = usePathname();
    const activeTab = pathName?.split("/").at(-1) as string;
    return (
        <Tabs value={activeTab}>
            <TabsList>
                <TabsTrigger value="profile" asChild><Link href={accountProfilePath()}>Profile</Link></TabsTrigger>
                <TabsTrigger value="password" asChild><Link href={accountPasswordPath()}>Password</Link></TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
export {AccountTabs};