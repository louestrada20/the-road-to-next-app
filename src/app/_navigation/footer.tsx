"use client"

import { LucideBuilding2, LucideRepeat } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getActiveOrganizationClient } from "@/features/organization/queries/get-active-organization-client"
import { organizationPath } from "@/paths"

type ActiveOrganization = {
    id: string
    name: string
} | null

const Footer = () => {
    const { user, isFetched } = useAuth()
    const [activeOrganization, setActiveOrganization] = useState<ActiveOrganization>(null)
    const [isOrgFetched, setIsOrgFetched] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const fetchActiveOrganization = async () => {
            if (user) {
                const org = await getActiveOrganizationClient()
                setActiveOrganization(org)
                setIsOrgFetched(true)
            }
        }
        
        if (isFetched) {
            fetchActiveOrganization()
        }
    }, [user, isFetched, pathname])

    // Don't render anything if user is not signed in or still fetching
    if (!isFetched || !user || !isOrgFetched) {
        return null
    }

    return (
        <footer className="supports-backdrop-blur:bg-background/60 fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
                    <LucideBuilding2 className="h-4 w-4" />
                    <span>
                        {activeOrganization ? (
                            <>Active Organization: <span className="font-medium text-foreground">{activeOrganization.name}</span></>
                        ) : (
                            "No Active Organization"
                        )}
                    </span>
                </div>
                <Link
                    href={organizationPath()}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                    <LucideRepeat className="h-4 w-4" />
                    Switch
                </Link>
            </div>
        </footer>
    )
}

export { Footer }

