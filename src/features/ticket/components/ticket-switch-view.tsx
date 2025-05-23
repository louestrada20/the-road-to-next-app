"use client"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {switchTicketView} from "@/features/ticket/actions/switch-ticket-view";

type TicketSwitchViewProps = {
    initialTickets: boolean,
    activeOrganizationName: string,
}


const TicketSwitchView =  ({initialTickets, activeOrganizationName}: TicketSwitchViewProps) => {
    const [isEnabled, setIsEnabled] = useState(initialTickets);
    const handleToggle = async (checked: boolean) => {
        setIsEnabled(checked)
        await switchTicketView(checked)
    }
    return (
    <div className="flex items-center space-x-2">
        <Switch id="ticket-view" checked={isEnabled} onCheckedChange={handleToggle}/>
            <Label htmlFor="ticket-view">{isEnabled ? `${activeOrganizationName} tickets` : "All my tickets"}</Label>
        </div>
    )
}

export {TicketSwitchView}