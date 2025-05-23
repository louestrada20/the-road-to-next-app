"use server"


import {revalidatePath} from "next/cache";
import {setCookieByKey} from "@/actions/cookies";
import {ticketsPath} from "@/paths";

export async function switchTicketView(enabled: boolean) {

    await setCookieByKey("ticket-view", enabled ? `active-organization-tickets`: `all-my-tickets`   )


    revalidatePath(ticketsPath())
    return enabled
}
